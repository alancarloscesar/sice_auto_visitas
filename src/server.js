import puppeteer from 'puppeteer';
import alunos from './datas_alunos.js';

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set headless: true se não precisar visualizar o processo
  const page = await browser.newPage();

  // Acessa o site desejado
  await page.goto('https://sice-orientador.seduc.ce.gov.br/sice-orientador/login.jsf');

  // Preenche o campos de login
  await page.type('#formTable\\:j_idt132\\:txtlg', '06823800321');
  await page.type('#formTable\\:j_idt142\\:txtpw', 'ac0221');// Substitua '#campoSenha' pelo seletor correto do campo de senha
  // Clica no botão (por exemplo, botão de login)
  await page.click('#formTable\\:j_idt149\\:j_idt150');  // Substitua '#botaoLogin' pelo seletor correto do botão de login
  // Aguarda a navegação (se a ação de clicar no botão for redirecionar para outra página)
  await page.waitForNavigation();

  await page.click('a.ui-menuitem-link.ui-submenu-link');//Acompanhamento de estágio
  await page.click('a.ui-menuitem-link[href="/sice-orientador/paginas/geral/avaliacao-visita.jsf"]');//Acompanhamento de visita

  // Filtra alunos ativos antes do loop
  const orderByName = alunos.sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));
  const alunosStatusAtivo = orderByName.filter(item => item.ativo == 1);

  let totalAlunos = 0;

  // Loop pelos alunos ativos
  for (let index = 0; index < alunosStatusAtivo.length; index++) {
    const aluno = alunosStatusAtivo[index];

    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.reload();


    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.waitForSelector('#novo', { visible: true });  // Certifica-se de que o elemento está visível
    await page.click('#novo');

    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.waitForSelector('#ano', { visible: true });
    await page.click('#ano')
    await page.select('#ano', '2025');  // Seleciona o ano "2025"

    // seleciona aluno
    await new Promise(resolve => setTimeout(resolve, 15000)); // espera 5 segundos
    await page.waitForSelector('#lstAlunos', { visible: true });
    await page.focus('#lstAlunos');
    // await page.select('#lstAlunos', `${aluno.value_aluno}`); // Seleciona o value do aluno atual
    await page.select('#lstAlunos', `${aluno.value_aluno}`); // Seleciona o value do aluno atual

    // Scroll descendo
    await page.evaluate(() => {
      window.scrollBy(0, 300);
    });

    // seleciona empresa
    await new Promise(resolve => setTimeout(resolve, 25000)); // verificar como funciona essa espera
    await page.waitForSelector('#j_idt222', { visible: true });
    await page.focus('#j_idt222');
    await page.select('#j_idt222', `${aluno.value_concedente}`); // Seleciona o value do concedente do aluno atual

    // DATAS DA VISITA
    await new Promise(resolve => setTimeout(resolve, 30000)); // espera 20 segundos
    await page.waitForSelector('#dtVisita_input', { visible: true });
    await page.focus('#dtVisita_input');
    await page.click('#dtVisita_input');
    const getDay = new Date(aluno.data_visita);//pegando o dia
    const dia = getDay.getUTCDate();
    await page.evaluate((dia) => {
      const links = document.querySelectorAll('a.ui-state-default');
      for (let link of links) {
        if (link.textContent.trim() === dia.toString()) {
          link.click();
          break;
        }
      }
    }, dia);

    //atividades comuns para todos
    await page.click('input[id="atividade:115:j_idt246:1"]');
    await page.click('input[id="atividade:116:j_idt246:1"]');
    await page.click('input[id="atividade:117:j_idt246:1"]');

    if (
      aluno.concedente == "Online Telecom Ibiapina" ||
      aluno.concedente == "MundiNet-Ibiapina" ||
      aluno.concedente == "MundiNet-Ubajara" ||
      aluno.concedente == "Online Telecom Ubajara") {

      if (aluno.value_aluno == 2630806 || aluno.value_aluno == 4172147 || aluno.value_aluno == 3048771
        || aluno.value_aluno == 3835531) { //natiele, samyle, aria vitoria, debora pereira

        //atividades extras
        await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        await page.click('#j_idt253');
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'REALIZA ATIVIDADES COM USO DOS SISTEMAS DA CONCEDENTE';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');

        //atividades extras
        await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        // await page.click('#j_idt253');
        // await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'REALIZA ATENDIMENTO AOS CLIENTES DA CONCEDENTE';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');

      } else {
        // Imputs de atividades
        await new Promise(resolve => setTimeout(resolve, 10000)); // espera 5 segundos
        await page.click('input[id="atividade:2:j_idt246:1"]');
        await page.click('input[id="atividade:79:j_idt246:1"]');
        await page.click('input[id="atividade:118:j_idt246:1"]');
        await page.click('input[id="atividade:119:j_idt246:1"]');
        await page.click('input[id="atividade:120:j_idt246:1"]');
        await page.click('input[id="atividade:121:j_idt246:1"]');
        await page.click('input[id="atividade:122:j_idt246:1"]');
        await page.click('input[id="atividade:134:j_idt246:1"]');
        await page.click('input[id="atividade:135:j_idt246:1"]');
      }

    } else if
      (aluno.concedente == "Copy Nort" || aluno.concedente == "Ematerce" || aluno.concedente == "Alpha Informática") {
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:74:j_idt246:1"]');
      await page.click('input[id="atividade:101:j_idt246:1"]');
      await page.click('input[id="atividade:123:j_idt246:1"]');
      await page.click('input[id="atividade:124:j_idt246:1"]');

      // Adicionando atividade extra
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'REALIZOU MANUTENÇÃO CORRETIVA/PREVENTIVA EM COMPUTADORES E IMPRESSORAS';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (aluno.concedente == "Sme-Ibiapina") {
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:74:j_idt246:1"]');
      await page.click('input[id="atividade:101:j_idt246:1"]');
      await page.click('input[id="atividade:123:j_idt246:1"]');
      await page.click('input[id="atividade:124:j_idt246:1"]');

      //ATIBLIDADES COMPLEMENTARES

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'MANUTENÇÕES CORRETIVAS/PREVENTIVAS EM IMPRESSORAS.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (aluno.concedente == "Mercantil Tio Augusto") {
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:15:j_idt246:1"]');
      await page.click('input[id="atividade:33:j_idt246:1"]');
      await page.click('input[id="atividade:95:j_idt246:1"]');

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'CRIAR DESIGN UTILIZANDO FERRAMENTA CANVA PARA DIVULGAÇÃO DE PRODUTOS, PROMOÇÕES E SOCIAL MEDIA.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (
      aluno.concedente == "Quem-Me-Quer" ||
      aluno.concedente == "Sme-Ubajara") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'GERENCIOU ATIVIDADE POR MEIO DO SISTEMA UTILIZADO PELA CONCEDENTE';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (aluno.concedente == "C-jovem") {

      //atividades extras
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'ACOMPANHAMENTO DAS ATIVIDADES PROPOSTAS PELO PROJETO C-JOVEM';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (aluno.concedente == "Construtora Imobiliaria 3 Marias") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:85:j_idt246:1"]');
      await page.click('input[id="atividade:95:j_idt246:1"]');
      await page.click('input[id="atividade:40:j_idt246:1"]');
      await page.click('input[id="atividade:56:j_idt246:1"]');

      //atividades extras
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'ATENDIMENTO AOS CLIENTES DA CONCEDENTE.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

      //atividades extras
      // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      // await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'REALIZA DESIGN PARA REDES SOCIAIS E IMPRESSÕES DA CONCEDENTE.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (aluno.concedente == "Dr. Paulo Guimarães") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:85:j_idt246:1"]');
      await page.click('input[id="atividade:95:j_idt246:1"]');

      //atividades extras
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'GERENCIA ATIVIDADES DA CONCEDENTE COM AUXÍLIO DE SOFTWARE.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

      //atividades extras
      // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      // await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'DESENVOLVE ATIVIDADES DE SOCIAL MEDIA.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');


    } else if (aluno.concedente == "Superpreparado") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:85:j_idt246:1"]');

      //atividades extras
      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'REALIZA EDIÇÃO DE VÍDEOS PARA MARKETING DA CONCEDENTE.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

      //atividades extras
      // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      // await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'ESTUDO SOBRE AGENTE DE INTELIGÊNCIA ARTIFICIAL';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

      //atividades extras
      // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      // await page.click('#j_idt253');
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
      await page.evaluate(() => {
        document.querySelector('#atvdSug').value = 'REALIZA DESIGN UTILIZANDO A FERRAMENTA CANVA.';
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
      await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
      await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
      await page.waitForSelector('#j_idt260', { visible: true });
      await page.click('#j_idt260');

    } else if (aluno.concedente == "Gráfica Tavares") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:60:j_idt246:1"]');
      await page.click('input[id="atividade:61:j_idt246:1"]');
      await page.click('input[id="atividade:65:j_idt246:1"]');
      await page.click('input[id="atividade:139:j_idt246:1"]');
      await page.click('input[id="atividade:161:j_idt246:1"]');

    } else if (aluno.concedente == "Neon Center") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:85:j_idt246:1"]');

      // INSERIR MAIS INFORMAÇÕES QUANDO A ESTAGIARIA ESTIVER DESENVOLVENDO AS ATIVIDADES

    } else if (aluno.concedente == "Ifce") {

      await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
      await page.click('input[id="atividade:64:j_idt246:1"]');
      await page.click('input[id="atividade:123:j_idt246:1"]');
      await page.click('input[id="atividade:124:j_idt246:1"]');
      await page.click('input[id="atividade:150:j_idt246:1"]');

    } else if (aluno.concedente == "Dr. Growth") {
      if (aluno.value_aluno == 2614575 || aluno.value_aluno == 2469678) {//fernando 

        await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        await page.click('input[id="atividade:95:j_idt246:1"]');


        //atividades extras
        await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        await page.click('#j_idt253');
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'Desenvolve atividades de social media para os clientes da concedente.';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');

        //atividades extras
        // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        // await page.click('#j_idt253');
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'Desenvolve atividade seguindo metodologia ágil(Trello).';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');

        //atividades extras
        // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        // await page.click('#j_idt253');
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'Edita vídeos com a plataforma CapCut.';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');

      } else {//luiz antonio

        await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        await page.click('input[id="atividade:95:j_idt246:1"]');
        await page.click('input[id="atividade:137:j_idt246:1"]');

        //atividades extras
        await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        await page.click('#j_idt253');
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'Desenvolve atividade seguindo metodologia ágil(Trello).';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');

        //atividades extras
        // await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
        // await page.click('#j_idt253');
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#atvdSug'); // Aguarda o campo estar disponível
        await page.evaluate(() => {
          document.querySelector('#atvdSug').value = 'Cria design utilizando a ferramenta de prototipação figma.';
        });
        await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
        await page.waitForSelector('#respSug', { visible: true }); // Espera o seletor após o clique
        await page.select('#respSug', 'RCA'); //REALIZOU COM AUXILIO
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 5 segundos
        await page.waitForSelector('#j_idt260', { visible: true });
        await page.click('#j_idt260');
      }
    }
    //o aluno atende aos requisitos da concedente
    // //o alunos[1] atende aos requisitos da concedente
    await new Promise(resolve => setTimeout(resolve, 6000)); // espera 5 segundos
    await page.waitForSelector('#obsAP', { visible: true });
    await page.evaluate(() => {
      document.querySelector('#obsAP').value = 'O ALUNO(A) ATENDE AOS REQUISITOS DA CONCEDENTE';
    });

    // avaliações atitudianais
    await new Promise(resolve => setTimeout(resolve, 3000)); // espera 5 segundos
    await page.waitForSelector('input[type="radio"][id="criterio:0:j_idt287:0"]', { visible: true });

    await page.click('input[type="radio"][id="criterio:0:j_idt287:0"]');//marca o radio button
    await page.click('input[type="radio"][id="criterio:1:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:2:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:3:j_idt287:0"]');
    await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
    await page.click('input[type="radio"][id="criterio:4:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:5:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:6:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:7:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:8:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:9:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:10:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:11:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:12:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:13:j_idt287:0"]');
    await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
    await page.click('input[type="radio"][id="criterio:14:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:15:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:16:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:17:j_idt287:2"]');
    await page.click('input[type="radio"][id="criterio:18:j_idt287:1"]');
    await page.click('input[type="radio"][id="criterio:19:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:20:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:21:j_idt287:0"]');
    await page.click('input[type="radio"][id="criterio:22:j_idt287:0"]');

    //o aluno atende ao requisitos parte 2
    await new Promise(resolve => setTimeout(resolve, 4000)); // espera 5 segundos
    await page.waitForSelector('#obsAA', { visible: true });
    await page.type('#obsAA', 'O ALUNO(A) ATENDE AOS REQUISITOS DA CONCEDENTE');


    //botão salvar
    await new Promise(resolve => setTimeout(resolve, 4000)); // espera 5 segundos
    await page.waitForSelector('button#salvar', { visible: true });
    // Clica no botão 'Salvar'
    await page.click('button#salvar');
    await new Promise(resolve => setTimeout(resolve, 6000)); // espera 5 segundos

    // Scroll NO TOPO
    await page.evaluate(() => {
      window.scrollBy(0, 0);
    });
    console.log(`Cadastro finalizado: ${aluno?.nome}`)
  }
  totalAlunos++;
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log("Total de alunos: " + totalAlunos)

  await new Promise(resolve => setTimeout(resolve, 5000)); // espera 5 segundos
  // Fecha o navegador
  // await browser.close();
})();