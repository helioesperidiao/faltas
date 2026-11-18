# Importação de planilhas

## Finalidade

As importações de alunos e de grade de horários leem a primeira aba de arquivos Excel (`.xlsx`, `.xls` e `.xlsm`), arquivos CSV ou TSV e PDFs com tabela textual. A posição das colunas não importa: o sistema encontra as informações pelo texto do cabeçalho da planilha antes de criar qualquer registro.

Em PDF, a tabela precisa ter texto selecionável e preservar as colunas do arquivo original. PDFs escaneados como imagem não contêm texto para leitura automática; nesse caso, a tela informa o motivo e a escola deve usar o PDF original com texto, CSV ou Excel.

Arquivos CSV e TSV são testados como UTF-8 e como Windows-1252 antes da leitura, usando a versão que preserva os acentos. Para arquivos Excel antigos (`.xls`), a aplicação carrega a biblioteca completa `codepage` da SheetJS e testa Windows-1252 e UTF-8 com o valor original de cada célula, escolhendo a leitura sem caracteres substitutos. Windows-1252 é a página de código normalmente usada por exportações brasileiras. Se não existir arquivo, aba ou linha para importar, a leitura termina sem enviar dados vazios ao servidor.

Um texto que já tenha sido salvo com o símbolo `�` não pode ter o acento original deduzido com segurança. Nessa situação, a planilha-fonte deve ser importada novamente após esta atualização; a grade atualiza a aula existente em vez de criar uma duplicata.

Para alunos, a importação reconhece o layout com `ANO_REF`, `CURSO`, `TURMA_PREF`, `SERIE`, `SIT_ALUNO`, `ALUNO`, `NOME_COMPL`, dados de nascimento, RG, contato do aluno e contatos de pai, mãe, financeiro e responsável legal. No layout, `ALUNO` é salvo como matrícula e `NOME_COMPL` como nome completo. Todos esses cabeçalhos são verificados antes da importação.

Uma importação de alunos é tratada como a lista oficial vigente. O sistema cria matrículas novas, atualiza quem já existe e arquiva logicamente os alunos que não vieram no arquivo. Uma matrícula arquivada que volta numa importação posterior é reativada, com o mesmo cadastro, histórico e registros, em vez de virar um segundo aluno; a resposta informa quantos foram reativados. Antes de enviar, a tela pede confirmação com o número de alunos (ou de aulas, na grade), porque quem não estiver na planilha será arquivado. Eles deixam de aparecer nas turmas, chamadas e listagens ativas, eliminando turmas de teste ou repetidas, mas o cadastro antigo, os históricos, faltas e demais registros continuam guardados no banco.

Para a grade, os cabeçalhos são `TURMA`, `DISCIPLINA`, `NOME_DESCIPLINA`, `SEMANA_EXTENSO` e `HORAINICIALFINAL`. `DISCIPLINA` é o código da disciplina e `NOME_DESCIPLINA` é o nome exibido. O valor de `SEMANA_EXTENSO`, como `quarta-feira`, é reduzido para o dia da semana, e `HORAINICIALFINAL`, como `10:50-11:40`, é separado em início e fim.

Ao importar novamente uma grade, uma aula já existente com a mesma turma, horário, dia e código é atualizada em vez de duplicada. Assim, uma reimportação com acentos corrigidos também atualiza os itens antigos que haviam sido salvos com símbolos. A planilha passa a ser a grade ativa oficial: as aulas que não vierem nela são arquivadas logicamente e não aparecem mais na listagem, mas continuam preservadas no banco.

## Horários de aula

A grade preserva horários com minutos e aceita formatos como `7`, `07:00`, `07h30`, `10:50-11:40` e valores de horário do Excel. Todos são guardados no formato `HH:MM`, evitando que uma formatação diferente da planilha cause erro ou descarte os minutos.

Intervalos como `07h30-08h20`, `7-8` e `07h - 08h` também são separados em início e fim já na tela.

## Como os cabeçalhos são reconhecidos

Primeiro valem os nomes exatos de cada campo. Só depois, e apenas entre as colunas que ainda não foram usadas, é aceito um cabeçalho que contenha o nome esperado como palavras inteiras (por exemplo, `TURMA PREF.`). Cabeçalhos vazios são ignorados e um cabeçalho curto não é lido como um campo mais longo: sem a coluna `ALUNO`, a matrícula é informada como cabeçalho não identificado, em vez de ser lida da coluna `ALUNO_DT_NASC`. Um arquivo sem linhas de dados mostra "Planilha vazia ou inválida".

## Datas e horas do Excel

Em `.xlsx` e `.xls`, datas e horas são números seriais. A leitura usa o código de data do próprio Excel, sem aplicar o fuso do computador: uma data de nascimento sai como `14/03/2005` e uma hora como `07:30`. Antes, a conversão pelo fuso de Brasília entregava o dia anterior e horas como `1/0/00`. A biblioteca `xlsx.full.min.js` (0.18.5) já embute as páginas de código, inclusive Windows-1252.

## Células com quebra de linha e linhas vazias

O CSV é lido de uma vez, respeitando as aspas: uma célula entre aspas pode conter o separador, aspas duplicadas e quebras de linha, que viram espaço. Linhas em branco ou só com separadores (`;;;`) são ignoradas, e as mensagens de falha apontam a linha real do arquivo. Se o arquivo tiver uma aspa sem par, ele é lido linha a linha, para o problema ficar restrito àquela linha em vez de juntar todo o resto numa célula.
