import fs from 'node:fs';
import alunos from './src/datas_alunos.js';
const logs = [
  'C:/Users/alanc/.codex/attachments/cab7372d-206e-4fc4-8535-dd354f6d83ac/Texto colado.txt',
  'C:/Users/alanc/.codex/attachments/91555614-8bf4-4e83-9e77-6cd522523d70/Texto colado.txt',
];
const normalizar = s => s.normalize('NFC').trim().toUpperCase();
const confirmados = new Set(['LUIS VINICIUS COSTA FERREIRA']); // Confirmação da mensagem mais recente do usuário.
for (const path of logs) {
  for (const match of fs.readFileSync(path, 'utf8').matchAll(/^Cadastro finalizado:\s*(.+)$/gm)) confirmados.add(normalizar(match[1]));
}
const feitos = alunos.filter(a => confirmados.has(normalizar(a.nome)));
const semConfirmacao = alunos.filter(a => !confirmados.has(normalizar(a.nome)));
const foraDaPlanilha = [...confirmados].filter(nome => !alunos.some(a => normalizar(a.nome) === nome));
const lista = itens => itens.map((a, i) => `${i + 1}. ${a.nome}`).join('\n');
const texto = `# Conferência nominal de cadastros\n\nBase: planilha atual e os dois logs enviados, acrescidos da confirmação de Luis Vinicius na última mensagem. Nomes repetidos nos logs foram contados uma única vez. Não houve consulta ao histórico de visitas do SICE. A ausência de confirmação nos logs não prova ausência de cadastro manual ou em outras execuções.\n\n- Alunos na planilha: ${alunos.length}.\n- Alunos com confirmação nos logs: ${feitos.length}.\n- Alunos sem confirmação nos logs: ${semConfirmacao.length}.\n\n## Cadastro confirmado nos logs\n\n${lista(feitos)}\n\n## Sem confirmação nos logs enviados\n\n${lista(semConfirmacao)}\n\n## Comparação com a planilha atual\n\n| Aluno | Value_aluno | Ativo | Confirmação nos logs |\n| --- | --- | --- | --- |\n${alunos.map(a => `| ${a.nome} | ${a.value_aluno} | ${a.ativo} | ${confirmados.has(normalizar(a.nome)) ? 'Sim' : 'Não'} |`).join('\n')}\n\n## Pendências identificadas\n\n- Maria Gisele: o SICE confirmou o código 3277548; o valor 2676088 pertencia a Maria Eliza e foi corrigido na planilha. A última execução parou antes de salvar a visita de Gisele.\n- Ativo=0 não comprova que um cadastro foi realizado. É apenas o controle de participação na próxima execução.\n- Victor Lima de Carvalho está sem Data_visita na planilha atual.\n${foraDaPlanilha.length ? '- Nomes dos logs ausentes da planilha: ' + foraDaPlanilha.join(', ') : '- Todos os nomes confirmados nos logs foram encontrados na planilha.'}\n`;
fs.mkdirSync('relatorios', { recursive: true });
fs.writeFileSync('relatorios/conferencia-cadastros.md', texto);
console.log(JSON.stringify({ total: alunos.length, confirmados: feitos.map(a => a.nome), semConfirmacao: semConfirmacao.map(a => a.nome) }, null, 2));
