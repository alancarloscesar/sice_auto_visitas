// Regras de atividades preservadas do cadastro original.
export async function preencherAtividades(auto, aluno) {
  aluno = { ...aluno, concedente: String(aluno.concedente || '').trim().toUpperCase() };
  for (const id of [115, 116, 117]) {
    await auto.marcar(`input[id="atividade:${id}:j_idt246:1"]`);
  }
  if (


    aluno.concedente == "MUNDI NET - IBIAPINA" ||
    aluno.concedente == "MUNDI NET - UBAJARA" ||
    aluno.concedente == "POP NET") {
    if (aluno.value_aluno == 3133871 || aluno.value_aluno == 3389371 || aluno.value_aluno == 3277548) {


      await auto.atividadeExtra('REALIZA ATIVIDADES COM USO DOS SISTEMAS DA CONCEDENTE');

      await auto.atividadeExtra('REALIZA ATENDIMENTO AOS CLIENTES DA CONCEDENTE');
    } else {

      await auto.marcar('input[id="atividade:2:j_idt246:1"]');
      await auto.marcar('input[id="atividade:79:j_idt246:1"]');
      await auto.marcar('input[id="atividade:118:j_idt246:1"]');
      await auto.marcar('input[id="atividade:119:j_idt246:1"]');
      await auto.marcar('input[id="atividade:120:j_idt246:1"]');
      await auto.marcar('input[id="atividade:121:j_idt246:1"]');
      await auto.marcar('input[id="atividade:122:j_idt246:1"]');
      await auto.marcar('input[id="atividade:134:j_idt246:1"]');
      await auto.marcar('input[id="atividade:135:j_idt246:1"]');
    }
  } else if
    (aluno.concedente == "EMATERCE" || aluno.concedente == "ALPHA INFORMÁTICA") {
    if (aluno.concedente == "EMATERCE") {
      await auto.marcar('input[id="atividade:74:j_idt246:1"]');
      await auto.marcar('input[id="atividade:101:j_idt246:1"]');
      await auto.marcar('input[id="atividade:123:j_idt246:1"]');
      await auto.marcar('input[id="atividade:124:j_idt246:1"]');
      await auto.marcar('input[id="atividade:137:j_idt246:1"]');
      await auto.atividadeExtra('CRIAR DESIGN PARA SOCIAL MEDIA.');
    } else {//ALPHA INFORMÁTICA
      await auto.marcar('input[id="atividade:74:j_idt246:1"]');
      await auto.marcar('input[id="atividade:101:j_idt246:1"]');
      await auto.marcar('input[id="atividade:123:j_idt246:1"]');
      await auto.marcar('input[id="atividade:124:j_idt246:1"]');
    }
  } else if (aluno.concedente == "SECRETARIA DE EDUCAÇÃO IBI") {
    await auto.marcar('input[id="atividade:74:j_idt246:1"]');
    await auto.marcar('input[id="atividade:101:j_idt246:1"]');
    await auto.marcar('input[id="atividade:123:j_idt246:1"]');
    await auto.marcar('input[id="atividade:124:j_idt246:1"]');

    await auto.atividadeExtra('MANUTENÇÕES CORRETIVAS/PREVENTIVAS EM IMPRESSORAS.');
  } else if (aluno.concedente == "COPY NORT INFORMÁTICA") {
    await auto.marcar('input[id="atividade:74:j_idt246:1"]');
    await auto.marcar('input[id="atividade:101:j_idt246:1"]');
    await auto.marcar('input[id="atividade:123:j_idt246:1"]');
    await auto.marcar('input[id="atividade:124:j_idt246:1"]');

    await auto.atividadeExtra('MANUTENÇÕES CORRETIVAS/PREVENTIVAS EM IMPRESSORAS.');
  }

  else if (aluno.concedente == "TIO AUGUSTO") {
    await auto.marcar('input[id="atividade:15:j_idt246:1"]');
    await auto.marcar('input[id="atividade:33:j_idt246:1"]');
    await auto.marcar('input[id="atividade:95:j_idt246:1"]');
    await auto.atividadeExtra('CRIAR DESIGN UTILIZANDO FERRAMENTA CANVA PARA DIVULGAÇÃO DE PRODUTOS, PROMOÇÕES E SOCIAL MEDIA.');
    await auto.atividadeExtra('EDITAR VÍDEOS UTILIZANDO FERRAMENTA CANVA PARA DIVULGAÇÃO DE PRODUTOS, PROMOÇÕES E SOCIAL MEDIA.');
  } else if (
    aluno.concedente == "ESCOLA QMQ") {
    await auto.atividadeExtra('GERENCIOU ATIVIDADE POR MEIO DO SISTEMA UTILIZADO PELA CONCEDENTE');
  }















  else if (aluno.concedente == "EDUARDO VASCONCELOS") {
    await auto.marcar('input[id="atividade:85:j_idt246:1"]');
    await auto.marcar('input[id="atividade:95:j_idt246:1"]');

    await auto.atividadeExtra('GERENCIA CAMPANHAS COM TRAFEGO PAGO.');



    await auto.atividadeExtra('DESENVOLVE ATIVIDADES DE SOCIAL MEDIA.');
  } else if (aluno.concedente == "SUPER PREPARADOS") {
    await auto.marcar('input[id="atividade:85:j_idt246:1"]');

    await auto.atividadeExtra('REALIZA EDIÇÃO DE VÍDEOS PARA MARKETING DA CONCEDENTE.');



    await auto.atividadeExtra('ESTUDO E APLICABILIDADE DE AGENTE DE INTELIGÊNCIA ARTIFICIAL (N8N)');



    await auto.atividadeExtra('REALIZA DESIGN UTILIZANDO A FERRAMENTA CANVA.');
  } else if (aluno.concedente == "GRÁFICA TAVARES") {
    await auto.marcar('input[id="atividade:60:j_idt246:1"]');
    await auto.marcar('input[id="atividade:61:j_idt246:1"]');
    await auto.marcar('input[id="atividade:65:j_idt246:1"]');
    await auto.marcar('input[id="atividade:139:j_idt246:1"]');
    await auto.marcar('input[id="atividade:161:j_idt246:1"]');
  } else if (aluno.concedente == "MARCELO - PONTO NEON") {
    await auto.marcar('input[id="atividade:85:j_idt246:1"]');
    await auto.marcar('input[id="atividade:55:j_idt246:1"]');
    await auto.marcar('input[id="atividade:60:j_idt246:1"]');
    await auto.marcar('input[id="atividade:61:j_idt246:1"]');
    await auto.marcar('input[id="atividade:65:j_idt246:1"]');
    await auto.marcar('input[id="atividade:139:j_idt246:1"]');
  } else if (aluno.concedente == "IFCE") {
    await auto.marcar('input[id="atividade:64:j_idt246:1"]');
    await auto.marcar('input[id="atividade:123:j_idt246:1"]');
    await auto.marcar('input[id="atividade:124:j_idt246:1"]');
    await auto.marcar('input[id="atividade:150:j_idt246:1"]');
  } else if (aluno.concedente == "DR. GROWTH") {
    if (aluno.value_aluno == 4985871) {//aynssa
      await auto.marcar('input[id="atividade:95:j_idt246:1"]');

      await auto.atividadeExtra('Desenvolve atividades para prospectar possíveis clientes através das redes sociais da concedente.');



      await auto.atividadeExtra('Desenvolve atividade seguindo metodologia ágil(Trello).');



      await auto.atividadeExtra('Edita vídeos com a plataforma CapCut.');
    } else {//renê
      await auto.marcar('input[id="atividade:95:j_idt246:1"]');
      await auto.marcar('input[id="atividade:137:j_idt246:1"]');

      await auto.atividadeExtra('Desenvolve atividade seguindo metodologia ágil(Trello).');



      await auto.atividadeExtra('Cria design utilizando a ferramenta de prototipação figma.');
    }
  } else if (aluno.concedente == "IET") {
    await auto.atividadeExtra('GERENCIOU ATIVIDADE POR MEIO DO SISTEMA UTILIZADO PELA CONCEDENTE');
  } else if (aluno.concedente == "INSTITUTO VEREDAS") {
    await auto.marcar('input[id="atividade:40:j_idt246:1"]');
    await auto.marcar('input[id="atividade:56:j_idt246:1"]');
    await auto.marcar('input[id="atividade:90:j_idt246:1"]');
    await auto.marcar('input[id="atividade:150:j_idt246:1"]');
    await auto.marcar('input[id="atividade:23:j_idt246:1"]');
    await auto.marcar('input[id="atividade:32:j_idt246:1"]');
    await auto.marcar('input[id="atividade:32:j_idt246:1"]');
    await auto.marcar('input[id="atividade:32:j_idt246:1"]');

    await auto.atividadeExtra('REALIZA ATIVIDADES COM USO DOS SISTEMAS DA CONCEDENTE');
  } else if (aluno.concedente == "ARIELLA CALÇADOS") {
    console.log("Ariella Calçados");

    await auto.atividadeExtra('REALIZA ATENDIMENTO AOS CLIENTES DA CONCEDENTE.');

    await auto.atividadeExtra('GERENCIA ATIVIDADES DE STORYMAKER.');

    await auto.atividadeExtra('REALIZA ATIVIDADES DE SOCIAL MEDIA PARA AS REDES SOCIAIS DA CONCEDENTE.');
  } else if (aluno.concedente == "CONSORCIO & CORRETAGEM DE SEGUROS PRIME LTDA") {

    await auto.atividadeExtra('REALIZA ATENDIMENTO AOS CLIENTES DA CONCEDENTE.');

    await auto.atividadeExtra('GERENCIA ATIVIDADES DE MARKETING COM A FERRAMENTA CANVA.');

    await auto.atividadeExtra('REALIZA ATIVIDADES DE SOCIAL MEDIA PARA AS REDES SOCIAIS DA CONCEDENTE.');
  }

}
