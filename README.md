# Automação de visitas SICE

Instale as dependências com `npm install` e execute com `npm start`.
`npm run dev` executa o mesmo comando, sem reinicialização automática.
Não utilize `node --watch` nesta automação: alterações detectadas nos arquivos
podem interromper o cadastro e iniciar o processamento novamente.
Os alunos ativos são lidos de `src/planilhas/dados_alunos.xlsx`.

## Organização

- `src/server.js`: login e cadastro de cada visita.
- `src/automacao.js`: espera por requisições, fila AJAX do PrimeFaces, campos disponíveis e confirmação de salvamento.
- `src/atividades.js`: regras de atividades por concedente/aluno.

Não há pausas fixas no cadastro. Cada espera termina ao cumprir sua condição;
30 segundos é apenas o limite máximo por etapa. Opções inexistentes, falhas de
comunicação ou falta de confirmação interrompem a execução. O navegador fica
aberto para conferência e o cadastro não é repetido automaticamente.

Antes de executar novamente após um erro, confira no SICE se a visita foi salva.
A execução não mantém histórico local dos alunos já cadastrados.

O ano do formulário permanece em 2026. A data da visita usa dia, mês e ano da
planilha. As credenciais existentes continuam compatíveis; opcionalmente podem
ser substituídas pelas variáveis de ambiente `SICE_LOGIN` e `SICE_SENHA`.

## Verificação

`node src/server.js --verificar-concedente=CODIGO_DO_ALUNO` consulta os nomes e
códigos das concedentes oferecidas pelo SICE para esse aluno, sem salvar visitas.
O código é o `Value_aluno` da planilha. Durante o cadastro, se `Value_concedente`
não estiver na lista já carregada, a execução informa as opções disponíveis
imediatamente, sem esperar 30 segundos por um código que não existe na lista.

`node src/server.js --verificar-abertura` testa o login e a abertura de **Novo**
no SICE real, parando antes de preencher ou salvar visitas. Em caso de falha,
registra informações do clique e salva `diagnostico-abertura.png` localmente.

`npm test` executa testes com Chromium e um servidor local que simula respostas
AJAX lentas. Não acessa o SICE nem cadastra visitas reais.

Os seletores numéricos do SICE foram preservados. Caso o portal mude seus IDs,
será necessário atualizá-los. A confirmação de inclusão de atividade procura o
texto em uma célula de tabela; a de salvamento procura uma nova mensagem de
sucesso do PrimeFaces. Esses detalhes precisam ser conferidos no portal real.
