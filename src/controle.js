import fs from 'node:fs';
import path from 'node:path';

export function dataISO(valor) {
  if (valor == null || valor === '') return null;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) throw new Error('Data_visita inválida');
    return valor.toISOString().slice(0, 10);
  }
  const texto = String(valor).trim();
  if (!texto) return null;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : texto;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('Use uma data do Excel, DD/MM/AAAA ou AAAA-MM-DD');
  const data = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== iso) throw new Error('Data_visita inválida');
  return iso;
}

export const chaveVisita = (aluno, data) => `${aluno.value_aluno}|${data}`;

export function lerHistorico(arquivo) {
  if (!fs.existsSync(arquivo)) return { versao: 1, visitas: {} };
  const historico = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  if (historico.versao !== 1 || !historico.visitas || typeof historico.visitas !== 'object' || Array.isArray(historico.visitas)) {
    throw new Error('Histórico inválido. Preserve o arquivo e confira antes de executar.');
  }
  return historico;
}

export function gravarJSON(arquivo, dados) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const temporario = `${arquivo}.${process.pid}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2) + '\n');
  fs.renameSync(temporario, arquivo);
}

export function planejar(alunos, historico) {
  const contagens = new Map();
  for (const a of alunos) contagens.set(String(a.value_aluno), (contagens.get(String(a.value_aluno)) || 0) + 1);
  return [...alunos].sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')).map(aluno => {
    const item = { aluno, nome: aluno.nome, data: null, status: 'aguardando', motivo: '' };
    if (aluno.ativo != 1) return { ...item, status: 'inativo', motivo: 'Ativo diferente de 1' };
    try {
      item.data = dataISO(aluno.data_visita);
      if (!item.data) return { ...item, status: 'sem_data', motivo: 'Sem visita informada; basta preencher a data quando houver' };
      for (const campo of ['nome', 'value_aluno', 'value_concedente']) {
        if (aluno[campo] == null || String(aluno[campo]).trim() === '') throw new Error(`Preencha ${campo} na planilha`);
      }
      if (contagens.get(String(aluno.value_aluno)) > 1) throw new Error('Value_aluno repetido na planilha; confira os nomes');
      const anterior = historico.visitas[chaveVisita(aluno, item.data)];
      if (anterior) {
        const concluida = ['confirmado_sice', 'informado_usuario'].includes(anterior.status);
        return { ...item, status: concluida ? 'ja_registrado' : 'conferir', motivo: concluida
          ? (anterior.status === 'informado_usuario' ? 'Cadastro informado como concluído pelo usuário' : 'Salvamento confirmado em execução anterior')
          : 'Houve tentativa de salvar sem confirmação. Confira no SICE antes de repetir' };
      }
    } catch (error) { return { ...item, status: 'erro', motivo: error.message }; }
    return item;
  });
}

export function registrarTentativa(historico, arquivo, item, status) {
  historico.visitas[chaveVisita(item.aluno, item.data)] = {
    nome: item.nome, data: item.data, concedente: item.aluno.value_concedente,
    status, atualizadoEm: new Date().toISOString(),
  };
  gravarJSON(arquivo, historico);
}

export async function executarLote(itens, historico, arquivo, executar) {
  for (const item of itens.filter(i => i.status === 'aguardando')) {
    let tentouSalvar = false;
    try {
      await executar(item, () => {
        registrarTentativa(historico, arquivo, item, 'em_confirmacao');
        tentouSalvar = true;
      });
      if (!tentouSalvar) throw new Error('O fluxo terminou sem tentar salvar');
      registrarTentativa(historico, arquivo, item, 'confirmado_sice');
      item.status = 'concluido';
      console.log('Cadastro finalizado: ' + item.nome);
    } catch (error) {
      item.status = tentouSalvar ? 'conferir' : 'erro';
      item.motivo = error.message;
      console.error(`${item.nome}: ${error.message}`);
      if (/sess[aã]o expirada|Target closed|Session closed|Connection closed|browser has disconnected/i.test(error.message)) break;
    }
  }
}

const titulos = {
  concluido: 'CADASTRADOS NESTA EXECUÇÃO', ja_registrado: 'JÁ REGISTRADOS — NÃO REPETIDOS',
  sem_data: 'SEM DATA DE VISITA', erro: 'PENDENTES COM ERRO', conferir: 'AGUARDANDO CONFERÊNCIA NO SICE',
  aguardando: 'AINDA NÃO PROCESSADOS', inativo: 'INATIVOS',
};

export function relatorio(itens, diretorio, previa = false) {
  const linhas = [`# ${previa ? 'Prévia' : 'Resultado'} dos cadastros`, '', `Gerado em: ${new Date().toISOString()}`, '',
    'O histórico local identifica a visita pelo código do aluno e pela data. Cadastros manuais ou feitos em outro computador não são consultados automaticamente.', ''];
  for (const [status, titulo] of Object.entries(titulos)) {
    const grupo = itens.filter(item => item.status === status);
    linhas.push(`## ${titulo} (${grupo.length})`, '');
    for (const item of grupo) linhas.push(`- ${item.nome} — ${item.data || 'sem data'}${item.motivo ? ': ' + item.motivo : ''}`);
    if (!grupo.length) linhas.push('Nenhum.');
    linhas.push('');
  }
  const base = previa ? 'previa' : 'ultima-execucao';
  fs.mkdirSync(diretorio, { recursive: true });
  fs.writeFileSync(path.join(diretorio, `${base}.md`), linhas.join('\n'));
  gravarJSON(path.join(diretorio, `${base}.json`), itens.map(({ aluno, ...item }) => item));
  console.log('\n' + linhas.join('\n'));
}

export function bloquearExecucao(arquivo) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  try { fs.writeFileSync(arquivo, String(process.pid), { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error(`Já existe uma execução ou um bloqueio de execução anterior: ${arquivo}. Se a anterior foi encerrada, remova apenas esse arquivo antes de tentar novamente.`);
  }
  return () => fs.unlinkSync(arquivo);
}
