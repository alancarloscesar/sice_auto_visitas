import puppeteer from 'puppeteer';
import alunos from './datas_alunos.js';
import { criarAutomacao } from './automacao.js';
import { preencherAtividades } from './atividades.js';

const URL_BASE = 'https://sice-orientador.seduc.ce.gov.br/sice-orientador';
const OBSERVACAO = 'O ALUNO(A) ATENDE AOS REQUISITOS DA CONCEDENTE';

async function main() {
  const verificarAbertura = process.argv.includes('--verificar-abertura');
  const verificarConcedente = process.argv.find(arg => arg.startsWith('--verificar-concedente='))?.split('=')[1];
  const ativos = alunos.filter(aluno => verificarConcedente ? String(aluno.value_aluno) === verificarConcedente : aluno.ativo == 1)
    .sort((a, b) => a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0);
  if (!ativos.length) { console.log('Nenhum aluno ativo.'); return; }

  // Valida o lote antes do login, evitando descobrir dados faltantes depois
  // de já ter cadastrado parte dos alunos.
  const pendencias = ativos.flatMap(aluno => [
    ['Value_aluno', aluno.value_aluno],
    ['Value_concedente', aluno.value_concedente],
  ].filter(([, valor]) => valor === null || valor === undefined || String(valor).trim() === '')
    .map(([campo]) => `${aluno.nome}: preencha ${campo}`));
  if (pendencias.length && !verificarAbertura && !verificarConcedente) {
    throw new Error(`Dados incompletos na planilha. Nenhum cadastro iniciado.\n${pendencias.join('\n')}`);
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const auto = await criarAutomacao(page);
  if (verificarAbertura) {
    page.on('pageerror', error => console.error('Erro JavaScript do portal:', error.message));
    page.on('request', req => {
      if (['xhr', 'fetch'].includes(req.resourceType())) console.log('AJAX:', req.method(), new URL(req.url()).pathname.split(';')[0]);
    });
  }
  let atual;
  let total = 0;
  try {
    await page.goto(URL_BASE + '/login.jsf', { waitUntil: 'domcontentloaded' });
    await auto.preencher('#formTable\\:j_idt116\\:txtlg', process.env.SICE_LOGIN || '06823800321');
    await auto.preencher('#formTable\\:j_idt123\\:txtpw', process.env.SICE_SENHA || 'ac0221');
    // Registra a espera ANTES do clique para não perder a navegação.
    await auto.pronto('#formTable\\:j_idt130\\:j_idt131');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('#formTable\\:j_idt130\\:j_idt131'),
    ]);
    await auto.pronto('a.ui-menuitem-link.ui-submenu-link');
    await page.goto(URL_BASE + '/paginas/geral/avaliacao-visita.jsf', { waitUntil: 'domcontentloaded' });

    for (const aluno of ativos) {
      atual = aluno.nome;
      console.log('Iniciando: ' + atual);
      // Mantém o formulário limpo entre alunos, sem pausas arbitrárias.
      if (total > 0) await page.reload({ waitUntil: 'domcontentloaded' });
      if (verificarAbertura) await page.evaluate(() => {
        window.__cliquesDiagnostico = [];
        document.addEventListener('click', event => window.__cliquesDiagnostico.push({ id: event.target.id, tag: event.target.tagName }), true);
      });
      await auto.abrirCadastro();
      if (verificarAbertura) {
        console.log('Verificação concluída: formulário de cadastro aberto. Nenhuma visita foi preenchida ou salva.');
        await browser.close();
        return;
      }
      await auto.selecionar('#ano', '2026');
      if (verificarConcedente) {
        console.log('Alunos correspondentes no SICE:', await page.$eval('#lstAlunos', (el, nomes) => [...el.options]
          .filter(op => nomes.some(nome => op.textContent.toUpperCase().includes(nome.toUpperCase())))
          .map(op => ({ codigo: op.value, nome: op.textContent.trim() })), ativos.map(item => item.nome)));
      }
      await auto.selecionarAluno(aluno.value_aluno, aluno.nome);
      if (verificarConcedente) {
        await auto.pronto('#j_idt222');
        console.log('Concedentes disponíveis:', await page.$eval('#j_idt222', el => [...el.options].map(op => ({ codigo: op.value, nome: op.textContent.trim() }))));
        console.log('Verificação concluída. Nenhuma visita salva.');
        await browser.close();
        return;
      }
      await auto.selecionar('#j_idt222', aluno.value_concedente, { opcoesCarregadas: true });

      const data = new Date(aluno.data_visita);
      if (Number.isNaN(data.getTime())) throw new Error('Data de visita inválida');
      const formatada = [data.getUTCDate(), data.getUTCMonth() + 1, data.getUTCFullYear()]
        .map((parte, i) => i < 2 ? String(parte).padStart(2, '0') : parte).join('/');
      await auto.preencher('#dtVisita_input', formatada);
      await page.waitForFunction(valor => document.querySelector('#dtVisita_input')?.value === valor, {}, formatada);

      await preencherAtividades(auto, aluno);
      await auto.preencher('#obsAP', OBSERVACAO);
      for (let criterio = 0; criterio <= 22; criterio++) {
        const resposta = criterio === 17 ? 2 : criterio === 18 ? 1 : 0;
        await auto.marcar(`input[id="criterio:${criterio}:j_idt287:${resposta}"]`);
      }
      await auto.preencher('#obsAA', OBSERVACAO);
      await auto.salvar();
      total++;
      console.log('Cadastro finalizado: ' + atual);
    }
    console.log('Total de alunos: ' + total);
    await browser.close();
  } catch (error) {
    if (verificarAbertura) {
      console.log('Diagnóstico do clique:', await page.evaluate(() => ({
        cliques: window.__cliquesDiagnostico,
        monitor: window.__siceRequests,
        novo: document.querySelector('#novo')?.outerHTML,
        formularios: [...document.forms].map(el => el.id),
      })).catch(() => 'Página indisponível'));
      await page.screenshot({ path: 'diagnostico-abertura.png' }).catch(() => {});
    }
    console.error('Processo interrompido' + (atual ? ' no aluno ' + atual : ' no login') + ': ' + error.message);
    console.error('Cadastros confirmados: ' + total + '. O navegador ficará aberto para conferência.');
    // Não repete automaticamente um salvamento, evitando cadastros duplicados.
    process.exitCode = 1;
    browser.disconnect();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
