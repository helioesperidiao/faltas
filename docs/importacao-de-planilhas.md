# Importação de planilhas

## Finalidade

As importações de alunos e de grade de horários leem a primeira aba de arquivos Excel (`.xlsx`, `.xls` e `.xlsm`) e também arquivos CSV ou TSV. A posição das colunas não importa: o sistema encontra as informações pelo texto do cabeçalho da planilha antes de criar qualquer registro.

Arquivos CSV e TSV são testados como UTF-8 e como Windows-1252 antes da leitura, usando a versão que preserva os acentos. Para arquivos Excel antigos (`.xls`), a aplicação carrega a biblioteca completa `codepage` da SheetJS e testa Windows-1252 e UTF-8 com o valor original de cada célula, escolhendo a leitura sem caracteres substitutos. Windows-1252 é a página de código normalmente usada por exportações brasileiras. Se não existir arquivo, aba ou linha para importar, a leitura termina sem enviar dados vazios ao servidor.

Um texto que já tenha sido salvo com o símbolo `�` não pode ter o acento original deduzido com segurança. Nessa situação, a planilha-fonte deve ser importada novamente após esta atualização; a grade atualiza a aula existente em vez de criar uma duplicata.

Para alunos, a importação reconhece o layout com `ANO_REF`, `CURSO`, `TURMA_PREF`, `SERIE`, `SIT_ALUNO`, `ALUNO`, `NOME_COMPL`, dados de nascimento, RG, contato do aluno e contatos de pai, mãe, financeiro e responsável legal. No layout, `ALUNO` é salvo como matrícula e `NOME_COMPL` como nome completo. Todos esses cabeçalhos são verificados antes da importação.

Para a grade, os cabeçalhos são `TURMA`, `DISCIPLINA`, `NOME_DESCIPLINA`, `SEMANA_EXTENSO` e `HORAINICIALFINAL`. `DISCIPLINA` é o código da disciplina e `NOME_DESCIPLINA` é o nome exibido. O valor de `SEMANA_EXTENSO`, como `quarta-feira`, é reduzido para o dia da semana, e `HORAINICIALFINAL`, como `10:50-11:40`, é separado em início e fim.

Ao importar novamente uma grade, uma aula já existente com a mesma turma, horário, dia e código é atualizada em vez de duplicada. Assim, uma reimportação com acentos corrigidos também atualiza os itens antigos que haviam sido salvos com símbolos.

## Horários de aula

A grade preserva horários com minutos e aceita formatos como `7`, `07:00`, `07h30`, `10:50-11:40` e valores de horário do Excel. Todos são guardados no formato `HH:MM`, evitando que uma formatação diferente da planilha cause erro ou descarte os minutos.
