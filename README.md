# Automação mensal de visitas SICE

## Todo mês

1. Atualize `Data_visita` em `src/planilhas/dados_alunos.xlsx` e salve/feche o Excel.
2. Mantenha `Ativo = 1` nos alunos que devem participar da execução.
3. Execute `npm start` (ou `npm run dev`, que faz a mesma coisa).
4. Faça o login manualmente na janela do SICE. Assim que o menu aparecer, o cadastro começa sozinho.

Deixe a data vazia quando não houver visita. O aluno aparecerá em **Sem data de
visita** e não impedirá o cadastro dos demais. Quando houver visita, basta colocar
a data. O ano do formulário é obtido dessa data, inclusive na mudança de ano.

Antes de executar, `npm run conferir` mostra uma prévia nominal sem abrir o
navegador nem acessar o SICE. Datas antigas já registradas não serão repetidas
nem interpretadas como visitas do próximo mês.

## Resultado e retomada

Ao final, o terminal e `relatorios/ultima-execucao.md` mostram todos os alunos:

- Cadastrados nesta execução.
- Já registrados em execução anterior ou informados como concluídos pelo usuário.
- Sem data de visita.
- Pendentes com erro, com o motivo.
- Aguardando conferência no SICE, quando houve tentativa de salvar sem confirmação.
- Não processados, se uma falha geral interrompeu o lote.
- Inativos.

Também é salvo `relatorios/ultima-execucao.json`. A prévia usa arquivos separados,
`relatorios/previa.md` e `relatorios/previa.json`, preservando o último resultado.

Erros individuais não impedem os próximos alunos. Sessão expirada ou perda da
conexão com o navegador interrompem o lote e deixam os restantes identificados.

O histórico `controle/historico.json` registra **código do aluno + data da visita**.
Preserve esse arquivo junto com o projeto. Reexecutar a mesma visita confirmada
não a cadastra novamente; uma data nova entra normalmente. O histórico não
consulta cadastros manuais ou feitos em outro computador. Alterar a data depois
de salvar cria uma visita diferente para esse controle.

Antes de clicar em Salvar, o programa grava uma tentativa no histórico. Se não
conseguir confirmar o resultado, deixa a visita para conferência e não repete o
envio automaticamente. Confira no SICE antes de corrigir esse registro de controle.

Um arquivo `controle/execucao.lock` impede duas execuções simultâneas. Ele é
removido ao terminar normalmente. Se o processo for encerrado à força, confirme
que não há outra execução e remova somente esse arquivo antes de reiniciar.

## Setembro de 2026

As 37 visitas com data de setembro foram marcadas no histórico como concluídas
**por informação do usuário em 28/09/2026**, sem nova consulta ou envio ao SICE.
Victor Lima de Carvalho permanece sem data, pois não teve visita nesse mês.

## Verificações técnicas

`npm test` verifica o controle de datas, retomada, relatórios e a automação em um
servidor local com respostas AJAX simuladas. Não cadastra visitas no SICE.

`node src/server.js --verificar-abertura` testa apenas login e abertura de Novo.
`node src/server.js --verificar-concedente=CODIGO_DO_ALUNO` consulta as opções de
concedente para esse aluno. Esses modos acessam o SICE, mas não salvam visitas.
`npm run diagnosticar-login` apenas abre a tela de login e grava o diagnóstico em
`relatorios/diagnostico-login.json` e `.png`; não envia credenciais nem salva visitas.

O programa confere o nome do aluno selecionado e os códigos de concedente antes
de preencher a avaliação. As regras por empresa ficam em `src/atividades.js`.
O login é sempre feito manualmente no navegador aberto pelo programa.

Mudanças no portal, nos vínculos de estágio ou nas atividades exigem atualização
dos respectivos dados/regras. Não use `node --watch`, pois ele pode reiniciar o
processo durante um cadastro.
