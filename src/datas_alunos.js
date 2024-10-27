import readXlsxFile from 'read-excel-file/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Defina o caminho do arquivo
const filePath = join(__dirname, 'planilhas', 'dados_alunos.xlsx');

// Declare a variável alunos fora da função
let alunos = []; // Inicialize como um array vazio

// Função para ler o arquivo Excel
async function readExcelFile() {
  try {
    const rows = await readXlsxFile(filePath);

    // Supondo que a primeira linha contém os cabeçalhos
    const headers = rows[0];

    // Mapeando os dados para o formato desejado
    alunos = rows.slice(1).map(row => ({
      nome: row[headers.indexOf('Nome')],  // Altere 'Nome' para o cabeçalho correto
      value_aluno: row[headers.indexOf('Value_aluno')], // Altere 'Value_aluno' para o cabeçalho correto
      concedente: row[headers.indexOf('Concedente')],  // Altere 'Concedente' para o cabeçalho correto
      value_concedente: row[headers.indexOf('Value_concedente')], // Altere 'Value_concedente' para o cabeçalho correto
      data_visita: row[headers.indexOf('Data_visita')], // Altere 'Data_visita' para o cabeçalho correto
      ativo: row[headers.indexOf('Ativo')],
      cidade_empresa: row[headers.indexOf('Cidade_empresa')]
    }));

  } catch (error) {
    console.error('Erro ao ler a planilha:', error);
  }
}

// Chame a função para ler a planilha
await readExcelFile(); // Use await para garantir que a função seja concluída

// Exporte a variável alunos
export default alunos;
