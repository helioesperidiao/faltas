# Importação de planilhas

## Finalidade

As importações de alunos e de grade de horários leem a primeira aba de arquivos Excel (`.xlsx`, `.xls` e `.xlsm`) e também arquivos CSV ou TSV. A posição das colunas não importa: o sistema encontra as informações pelo texto do cabeçalho da planilha antes de criar qualquer registro.

Para alunos, os campos essenciais são matrícula, nome e turma. Para a grade, são turma, horário de início, horário de fim, dia, código e disciplina. Os nomes podem variar, por exemplo, `Matrícula` ou `RA`, `Nome do aluno`, `Horário início`, `Dia da semana` e `Código`. Se algum campo obrigatório não for reconhecido, a importação é interrompida e mostra quais cabeçalhos faltaram.

## Horários de aula

A grade preserva horários com minutos e aceita formatos como `7`, `07:00`, `07h30` e valores de horário do Excel. Todos são guardados no formato `HH:MM`, evitando que uma formatação diferente da planilha cause erro ou descarte os minutos.
