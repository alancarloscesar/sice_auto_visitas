// O limite é um teto por etapa: a execução continua assim que a condição se cumpre.
export async function criarAutomacao(page, timeout = 30000) {
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);
  const monitorar = () => {
    if (window.__siceRequests) return;
    const estado = window.__siceRequests = { pendentes: 0, iniciadas: 0, erro: null };
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...args) {
      estado.pendentes++;
      estado.iniciadas++;
      this.addEventListener('loadend', () => {
        estado.pendentes--;
        if (this.status === 0 || this.status >= 400) estado.erro = `HTTP ${this.status}`;
      }, { once: true });
      try { return send.apply(this, args); }
      catch (error) { estado.pendentes--; estado.erro = error.message; throw error; }
    };
    const fetchOriginal = window.fetch;
    window.fetch = async (...args) => {
      estado.pendentes++;
      estado.iniciadas++;
      try {
        const resposta = await fetchOriginal.apply(window, args);
        // Aguarda também a transferência do corpo, não apenas os cabeçalhos.
        await resposta.clone().arrayBuffer();
        if (!resposta.ok) estado.erro = `HTTP ${resposta.status}`;
        return resposta;
      } catch (error) { estado.erro = error.message; throw error; }
      finally { estado.pendentes--; }
    };
  };
  await page.evaluateOnNewDocument(monitorar);
  await page.evaluate(monitorar);

  async function aguardar() {
    await page.waitForFunction(() => {
      const aviso = document.querySelector('#ErrorAjax');
      if (aviso?.getClientRects().length && getComputedStyle(aviso).visibility !== 'hidden') {
        throw new Error(`SICE: ${aviso.textContent.trim()}`);
      }
      const fila = window.PrimeFaces?.ajax?.Queue;
      return document.readyState === 'complete'
        && !window.__siceRequests?.pendentes
        && !window.jQuery?.active
        && (!fila?.isEmpty || fila.isEmpty());
    });
    const erro = await page.evaluate(() => window.__siceRequests?.erro);
    if (erro) throw new Error(`Falha na comunicação com o SICE: ${erro}`);
  }

  async function pronto(seletor) {
    await aguardar();
    await page.waitForSelector(seletor, { visible: true });
    await page.waitForFunction(s => {
      const el = document.querySelector(s);
      return el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    }, {}, seletor);
  }

  async function executar(descricao, acao, exigirRequisicao = false) {
    try {
      await aguardar();
      const antes = await page.evaluate(() => window.__siceRequests.iniciadas);
      await acao();
      if (exigirRequisicao) {
        await page.waitForFunction(n => window.__siceRequests.iniciadas > n, {}, antes);
      }
      await aguardar();
    } catch (error) {
      throw new Error(`Etapa "${descricao}": ${error.message}`, { cause: error });
    }
  }

  async function clicar(seletor, exigirRequisicao = false) {
    await pronto(seletor);
    // A presença do botão não garante que o clique chegue a ele: o painel
    // "Carregando" do PrimeFaces pode estar cobrindo o formulário.
    await page.$eval(seletor, el => el.scrollIntoView({ block: 'center', inline: 'center' }));
    await page.waitForFunction(s => {
      const el = document.querySelector(s);
      if (!el || el.disabled) return false;
      const rect = el.getBoundingClientRect();
      const x = (Math.max(0, rect.left) + Math.min(innerWidth, rect.right)) / 2;
      const y = (Math.max(0, rect.top) + Math.min(innerHeight, rect.bottom)) / 2;
      const alvo = document.elementFromPoint(x, y);
      return !!rect.width && !!rect.height && (alvo === el || el.contains(alvo));
    }, {}, seletor);
    // Usa a ativação do elemento, sem depender das coordenadas do Chromium
    // em uma janela com escala/viewport diferente. Preserva o onclick do JSF.
    await executar(`clicar ${seletor}`, () => page.$eval(seletor, el => el.click()), exigirRequisicao);
  }

  async function abrirCadastro() {
    await clicar('#novo', true);
    await verificarErros();
    await pronto('#formCadastro #ano');
  }

  async function selecionar(seletor, valor, { opcoesCarregadas = false } = {}) {
    if (valor === null || valor === undefined || String(valor).trim() === '') {
      throw new Error(`Valor não informado para ${seletor}. Corrija o campo correspondente na planilha antes de executar.`);
    }
    valor = String(valor);
    await pronto(seletor);
    if (opcoesCarregadas) {
      const opcoes = await page.$eval(seletor, el => [...el.options]
        .filter(op => !op.disabled).map(op => ({ codigo: op.value, nome: op.textContent.trim() })));
      if (!opcoes.some(op => op.codigo === valor)) {
        throw new Error(`O código ${valor} não está disponível em ${seletor} após o carregamento. Confira Value_concedente na planilha. Opções do SICE: ${opcoes.map(op => `${op.codigo} — ${op.nome}`).join('; ')}`);
      }
    }
    await page.waitForFunction((s, v) => [...(document.querySelector(s)?.options || [])]
      .some(op => op.value === v && !op.disabled), {}, seletor, valor);
    const ajax = await page.$eval(seletor, el => /PrimeFaces|jsf\.ajax|mojarra/.test(el.getAttribute('onchange') || ''));
    await executar(`selecionar ${seletor}`, () => page.select(seletor, valor), ajax);
    await page.waitForFunction((s, v) => document.querySelector(s)?.value === v, {}, seletor, valor);
  }

  async function preencher(seletor, valor) {
    await pronto(seletor);
    await executar(`preencher ${seletor}`, () => page.$eval(seletor, (el, texto) => {
      el.value = texto;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
    }, valor));
  }

  async function selecionarAluno(codigo, nomeEsperado) {
    await selecionar('#lstAlunos', codigo);
    const nomeSelecionado = await page.$eval('#lstAlunos', el => el.selectedOptions[0]?.textContent.trim() || '');
    const normalizar = nome => nome.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/gu, ' ').trim().toUpperCase();
    const esperado = normalizar(nomeEsperado);
    const selecionado = normalizar(nomeSelecionado);
    // O SICE pode manter sobrenomes adicionais que ainda não constam na planilha.
    // Aceita somente o nome da planilha como início do nome oficial; nomes com
    // diferença no início continuam bloqueados.
    if (selecionado !== esperado && !selecionado.startsWith(`${esperado} `)) {
      throw new Error(`Value_aluno ${codigo} selecionou "${nomeSelecionado}", mas a planilha informa "${nomeEsperado}". Corrija o código do aluno antes de cadastrar a visita.`);
    }
    if (selecionado !== esperado) console.log(`Nome confirmado com complemento no SICE: ${nomeSelecionado}`);
  }

  async function marcar(seletor) {
    await pronto(seletor);
    if (!await page.$eval(seletor, el => el.checked)) await clicar(seletor);
    await page.waitForFunction(s => document.querySelector(s)?.checked, {}, seletor);
  }

  async function atividadeExtra(texto) {
    const aberto = await page.$eval('body', () => {
      const el = document.querySelector('#atvdSug');
      return !!el?.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    });
    if (!aberto) await clicar('#j_idt253');
    await preencher('#atvdSug', texto);
    await selecionar('#respSug', 'RCA');
    // O SICE converte descrições para maiúsculas ao renderizar a tabela.
    // Compara o conteúdo normalizado e exige uma NOVA ocorrência, para não
    // confundir uma linha anterior com a confirmação desta inclusão.
    const conferirLinhas = (descricao, quantidadeAnterior) => {
      const normalizar = valor => valor.normalize('NFC').replace(/\s+/gu, ' ').trim().toLocaleUpperCase('pt-BR');
      const esperado = normalizar(descricao);
      const quantidade = [...document.querySelectorAll('td')]
        .filter(el => el.getClientRects().length && normalizar(el.textContent) === esperado).length;
      return quantidadeAnterior === undefined ? quantidade : quantidade > quantidadeAnterior;
    };
    const quantidadeAntes = await page.evaluate(conferirLinhas, texto);
    await clicar('#j_idt260', true);
    await verificarErros();
    await page.waitForFunction(conferirLinhas, {}, texto, quantidadeAntes);
  }

  async function verificarErros() {
    const mensagens = await page.$$eval('.ui-messages-error, .ui-message-error, .ui-messages-fatal, .ui-growl-message-error, #ErrorAjax',
      els => els.filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').map(el => el.textContent.trim()));
    if (mensagens.length) throw new Error(`SICE: ${mensagens.join('; ')}`);
  }

  async function salvar(antesDoClique = () => {}) {
    await pronto('button#salvar');
    // Mensagens antigas (por exemplo, de uma atividade extra) não confirmam esta visita.
    await page.evaluate(() => {
      const seletor = '.ui-messages-info, .ui-growl-message';
      window.__siceMensagensAnteriores = new Map([...document.querySelectorAll(seletor)]
        .map(el => [el, el.textContent]));
    });
    await antesDoClique();
    await clicar('button#salvar', true);
    await verificarErros();
    await page.waitForFunction(() => [...document.querySelectorAll('.ui-messages-info, .ui-growl-message')]
      .some(el => el.getClientRects().length
        && window.__siceMensagensAnteriores?.get(el) !== el.textContent
        && /sucesso|salv[oa]|cadastrad[oa]/i.test(el.textContent)));
  }

  const operacoes = { aguardar, pronto, executar, clicar, abrirCadastro, selecionar, selecionarAluno, preencher, marcar, atividadeExtra, verificarErros, salvar };
  return Object.fromEntries(Object.entries(operacoes).map(([nome, operacao]) => [nome, async (...args) => {
    // Não registra conteúdo de campos, credenciais ou textos da avaliação.
    const seletor = ['pronto', 'clicar', 'selecionar', 'preencher', 'marcar'].includes(nome) ? args[0] : null;
    const etapa = nome + (seletor ? ` ${seletor}` : '');
    console.log(`Etapa: ${etapa}`);
    try {
      return await operacao(...args);
    } catch (error) {
      try { await verificarErros(); }
      catch (erroPortal) { error = erroPortal; }
      let diagnostico;
      try {
        diagnostico = await page.evaluate(s => {
          const el = s ? document.querySelector(s) : null;
          const fila = window.PrimeFaces?.ajax?.Queue;
          return {
            requisicoesPendentes: window.__siceRequests?.pendentes,
            jqueryAtivo: window.jQuery?.active,
            filaVazia: fila?.isEmpty?.(),
            campo: s ? {
              encontrado: !!el,
              visivel: !!el?.getClientRects().length,
              desabilitado: el?.disabled,
              // Somente valores de opções, sem nomes de alunos.
              opcoes: el?.options ? [...el.options].map(op => op.value) : undefined,
            } : undefined,
          };
        }, seletor);
      } catch { diagnostico = { paginaIndisponivel: true }; }
      const esperado = nome === 'selecionar' ? ` (valor esperado: ${String(args[1])})` : '';
      throw new Error(`Etapa "${etapa}"${esperado}: ${error.message}. Diagnóstico: ${JSON.stringify(diagnostico)}`, { cause: error });
    }
  }]));
}
