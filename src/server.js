import puppeteer from 'puppeteer';
import alunos from './datas_alunos.js';
import { criarAutomacao } from './automacao.js';
import { preencherAtividades } from './atividades.js';

import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { lerHistorico, planejar, executarLote, relatorio, bloquearExecucao } from './controle.js';

const URL_BASE = 'https://sice-orientador.seduc.ce.gov.br/sice-orientador';
const OBSERVACAO = 'O ALUNO(A) ATENDE AOS REQUISITOS DA CONCEDENTE';
const HISTORICO = fileURLToPath(new URL('../controle/historico.json', import.meta.url));
const RELATORIOS = fileURLToPath(new URL('../relatorios', import.meta.url));
const BLOQUEIO = fileURLToPath(new URL('../controle/execucao.lock', import.meta.url));
const DIAGNOSTICO_LOGIN = fileURLToPath(new URL('../relatorios/diagnostico-login.json', import.meta.url));

async function registrarDiagnosticoLogin(page) {
  const dados = await page.evaluate(() => ({
    url: location.href,
    titulo: document.title,
    campos: [...document.querySelectorAll('input')].map(el => ({ id: el.id, type: el.type, name: el.name })),
    botoes: [...document.querySelectorAll('button, input[type="submit"]')].map(el => ({ id: el.id, texto: el.textContent.trim(), type: el.type })),
    texto: document.body?.innerText?.replace(/\s+/gu, ' ').slice(0, 1_000) || '',
  })).catch(() => ({ url: page.url(), indisponivel: true }));
  fs.mkdirSync(RELATORIOS, { recursive: true });
  fs.writeFileSync(DIAGNOSTICO_LOGIN, JSON.stringify(dados, null, 2));
  await page.screenshot({ path: fileURLToPath(new URL('../relatorios/diagnostico-login.png', import.meta.url)), fullPage: true }).catch(() => {});
  return dados;
}

async function main() {
  const previa = process.argv.includes('--conferir');
  const verificarAbertura = process.argv.includes('--verificar-abertura');
  const diagnosticarLogin = process.argv.includes('--diagnosticar-login');
  const verificarConcedente = process.argv.find(arg => arg.startsWith('--verificar-concedente='))?.split('=')[1];
  const diagnostico = verificarAbertura || verificarConcedente || diagnosticarLogin;
  const liberar = previa || diagnostico ? () => {} : bloquearExecucao(BLOQUEIO);
  let browser;
  let itens;
  let falhaGeral;
  try {
    const historico = lerHistorico(HISTORICO);
    itens = planejar(alunos, historico);
    if (previa || (!diagnostico && !itens.some(i => i.status === 'aguardando'))) return;
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const auto = await criarAutomacao(page);
    await page.goto(URL_BASE + '/login.jsf', { waitUntil: 'domcontentloaded' });
    if (diagnosticarLogin) {
      console.log('Diagnóstico do login:', await registrarDiagnosticoLogin(page));
      console.log('Nenhuma credencial foi enviada e nenhuma visita foi salva.');
      return;
    }
    console.log('Faça o login manualmente no navegador aberto. A automação continuará assim que o SICE liberar o menu.');
    // Sem limite: a pessoa pode digitar a senha, usar autenticação adicional
    // ou resolver qualquer etapa legítima do portal no próprio navegador.
    await page.waitForFunction(() => location.pathname !== '/sice-orientador/login.jsf'
      && !!document.querySelector('a.ui-menuitem-link.ui-submenu-link'), { timeout: 0 });
    await auto.pronto('a.ui-menuitem-link.ui-submenu-link');
    await page.goto(URL_BASE + '/paginas/geral/avaliacao-visita.jsf', { waitUntil: 'domcontentloaded' });


    if (diagnostico) {
      await auto.abrirCadastro();
      if (verificarConcedente) {
        const aluno = alunos.find(a => String(a.value_aluno) === verificarConcedente);
        if (!aluno) throw new Error('Aluno não encontrado na planilha');
        const ano = aluno.data_visita ? new Date(aluno.data_visita).getUTCFullYear() : new Date().getFullYear();
        await auto.selecionar('#ano', String(ano));
        await auto.selecionarAluno(aluno.value_aluno, aluno.nome);
        await auto.pronto('#j_idt222');
        console.log('Concedentes disponíveis:', await page.$eval('#j_idt222', el => [...el.options].map(op => ({ codigo: op.value, nome: op.textContent.trim() }))));
      }
      console.log('Verificação concluída. Nenhuma visita salva.');
      return;
    }
    await executarLote(itens, historico, HISTORICO, async (item, antesDoClique) => {
      const aluno = item.aluno;
      console.log('Iniciando: ' + aluno.nome);
      // Uma página limpa evita carregar dados ou erros do aluno anterior.
      await page.goto(URL_BASE + '/paginas/geral/avaliacao-visita.jsf', { waitUntil: 'domcontentloaded' });
      await auto.abrirCadastro();
      await auto.selecionar('#ano', item.data.slice(0, 4));
      await auto.selecionarAluno(aluno.value_aluno, aluno.nome);
      await auto.selecionar('#j_idt222', aluno.value_concedente, { opcoesCarregadas: true });
      const data = new Date(item.data + "T00:00:00Z");
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

      await auto.salvar(antesDoClique);
    });
  } catch (error) {
    if (browser && /formTable.*txtlg/.test(error.message)) {
      console.error('Diagnóstico do login:', await registrarDiagnosticoLogin((await browser.pages())[0]).catch(() => 'Não foi possível registrar.'));
    }
    falhaGeral = error;
    console.error('Execução interrompida: ' + error.message);
    if (itens) for (const item of itens.filter(i => i.status === 'aguardando')) item.motivo = 'Não processado: ' + error.message;
  } finally {
    try {
      if (browser) {
        if (falhaGeral || itens?.some(i => ['erro', 'conferir'].includes(i.status))) {
          browser.disconnect();
          console.log('Navegador mantido aberto para conferência.');
        } else await browser.close();
      }
      if (itens && !diagnostico) relatorio(itens, RELATORIOS, previa);
      if (falhaGeral || (!previa && !diagnostico && itens?.some(i => ['erro', 'conferir', 'aguardando'].includes(i.status)))) process.exitCode = 1;
    } finally { liberar(); }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
