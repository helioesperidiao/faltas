# Fechamento diário

## Finalidade

Na tela **Entradas e Saídas**, o botão **Fechar dia e baixar CSVs** monta o fechamento da data escolhida sem alterar ou apagar registros existentes. O sistema baixa quatro arquivos: alunos atrasados, alunos que saíram antecipadamente, faltas daquele dia e o histórico de faltas da escola de todos os anos.

Os três arquivos referentes ao dia trazem uma coluna com o e-mail do pai de cada aluno e, no começo do arquivo, uma lista única de todos os e-mails encontrados, separados por vírgula. Isso permite abrir o CSV e copiar a lista diretamente para uma comunicação com os responsáveis. Quando o e-mail do pai não estiver cadastrado, o campo fica em branco.

Entradas registradas no módulo são tratadas como atrasos e saídas como saídas antecipadas. As faltas dos CSVs vêm exclusivamente da **Chamada**. Faltas abonadas e dispensadas não entram nos arquivos. O arquivo histórico mantém todas as faltas válidas da escola, inclusive de anos anteriores.

Para registrar vários alunos de uma vez, a pessoa pesquisa ou digita o aluno e usa **Adicionar à lista** (ou pressiona Enter). A prévia aparece abaixo sem salvar nada. Ao terminar, usa **Salvar lista de atrasados** ou **Salvar lista de saídas antecipadas**; somente nessa confirmação toda a lista correspondente é gravada no banco de uma vez.

## Horários

O fechamento diário é disponibilizado exclusivamente em CSV. Para registrar movimentações no período da tarde, estão disponíveis os horários 13:00, 13:50, 14:40, 15:30, 16:20 e 17:00, além dos horários da manhã.
