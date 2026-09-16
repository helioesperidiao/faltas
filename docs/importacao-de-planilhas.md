# Importação de planilhas

## Finalidade

As importações de alunos e de grade de horários leem a primeira aba de arquivos Excel (`.xlsx`, `.xls` e `.xlsm`) e também arquivos CSV ou TSV. A posição das colunas não importa: o sistema encontra as informações pelo texto do cabeçalho da planilha antes de criar qualquer registro.

Para alunos, a importação reconhece o layout com `ANO_REF`, `CURSO`, `TURMA_PREF`, `SERIE`, `SIT_ALUNO`, `ALUNO`, `NOME_COMPL`, dados de nascimento, RG, contato do aluno e contatos de pai, mãe, financeiro e responsável legal. No layout, `ALUNO` é salvo como matrícula e `NOME_COMPL` como nome completo. Todos esses cabeçalhos são verificados antes da importação.

Para a grade, os cabeçalhos são `TURMA`, `DISCIPLINA`, `NOME_DESCIPLINA`, `SEMANA_EXTENSO` e `HORAINICIALFINAL`. `DISCIPLINA` é o código da disciplina e `NOME_DESCIPLINA` é o nome exibido. O valor de `SEMANA_EXTENSO`, como `quarta-feira`, é reduzido para o dia da semana, e `HORAINICIALFINAL`, como `10:50-11:40`, é separado em início e fim.

## Horários de aula

A grade preserva horários com minutos e aceita formatos como `7`, `07:00`, `07h30`, `10:50-11:40` e valores de horário do Excel. Todos são guardados no formato `HH:MM`, evitando que uma formatação diferente da planilha cause erro ou descarte os minutos.
