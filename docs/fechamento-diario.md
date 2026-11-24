# Entradas, saídas e arquivos CSV

## Registro de movimentos

Na tela **Entradas e Saídas**, informe a matrícula e selecione data, horário, tipo e motivo: `com responsável`, `atestado`, `orientação` ou `bilhete`. Opcionalmente, selecione uma imagem JPG ou PNG de até 5 MB. Pressione Enter para adicionar o aluno à prévia; a imagem e o motivo ficam vinculados a esse aluno. **Finalizar lista de alunos** grava os movimentos e envia as imagens. Se um anexo falhar, o item permanece na prévia para nova tentativa, sem repetir o movimento já salvo.

O histórico do dia mostra motivo e acesso à imagem, que é servida por uma rota autenticada. As imagens ficam em `uploads/movimentacao` no servidor; essa pasta precisa acompanhar o banco nas cópias de segurança. Registros antigos podem não ter motivo ou imagem. Reenvios do mesmo aluno, data, horário e tipo reutilizam o movimento ativo existente e atualizam seu motivo; horários ou tipos diferentes são movimentos separados. Duplicatas antigas permanecem no banco, mas a consulta apresenta apenas uma movimentação para essa combinação.

## Arquivos CSV

A área **Arquivos CSV** usa o dia selecionado em **Dia dos registros** e oferece antecipados, atrasados, faltas do dia inteiro e geral. Cada ação baixa o arquivo de faltas e outro com os e-mails dos pais correspondentes, sem repetir endereços. O arquivo de faltas contém `Ano`, `Codigo da Disciplina`, `Data`, `Horário início de cada aula`, `Matricula` e `Motivo`. O motivo é preenchido para aulas associadas a uma entrada ou saída e fica vazio quando não há movimento correspondente.

Cada linha corresponde a uma aula perdida, cruzando turma e dia com a grade. A entrada marca ausência nas aulas anteriores ao horário registrado; a saída marca ausência nas aulas iniciadas a partir dela. Quando há vários movimentos, cada um altera o estado a partir do horário informado. O geral reúne as aulas ausentes sem duplicar aluno, data, disciplina e horário. Os arquivos por categoria também eliminam aulas duplicadas. Se uma turma não tiver grade para o dia, a geração é bloqueada e a tela informa quais turmas precisam de correção. A grade ativa também é usada para datas anteriores; alterações posteriores da grade podem afetar relatórios antigos.

Faltas abonadas entram nos arquivos geral e de dia inteiro. Um abono aprovado cobre todos os dias do seu período, inclusive as datas inicial e final, e produz faltas nas aulas da grade mesmo se a chamada daquele dia ainda não foi registrada. Abonos pendentes ou rejeitados não têm esse efeito. Aulas cobertas por dispensa e registros excluídos logicamente ficam fora do fechamento; um abono aprovado no dia inclui todas as aulas da grade, inclusive as que tenham dispensa por disciplina. O fechamento não apaga nem restaura registros excluídos.
