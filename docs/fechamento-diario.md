# Entradas, saídas e arquivos CSV

## Finalidade

Na tela **Entradas e Saídas**, a pessoa informa a matrícula do aluno. O nome é buscado automaticamente no cadastro e aparece no campo ao lado. Ao pressionar Enter, o aluno entra apenas na prévia; os registros não são gravados nesse momento. Depois de incluir todos, o botão **Finalizar lista de alunos** salva de uma vez os atrasos e as saídas antecipadas.

A tela não permite cadastrar faltas. As faltas são registradas exclusivamente na **Chamada** e são essas informações que alimentam o arquivo de faltas gerais da escola. Faltas abonadas, dispensadas ou excluídas não aparecem no arquivo.

## Arquivos CSV

A área **Arquivos CSV** usa o dia selecionado em **Dia dos registros** e oferece quatro ações: antecipados, atrasados, faltas do dia inteiro e geral. Cada ação baixa o arquivo de faltas e um segundo arquivo com os e-mails dos pais correspondentes, sem repetir endereços.

O arquivo de faltas começa com os cabeçalhos `Ano`, `Codigo da Disciplina`, `Data`, `Horário início de cada aula` e `Matricula`. Cada linha corresponde a uma aula perdida, cruzando turma e dia com a grade. A entrada marca ausência nas aulas anteriores ao horário registrado; a saída marca ausência nas aulas iniciadas a partir dela. As faltas abonadas e dispensadas não entram. O arquivo geral reúne as três categorias sem duplicar uma mesma aula do aluno. Se uma turma não tiver grade para o dia, a geração é bloqueada e a tela informa quais turmas precisam de correção, para evitar arquivos incompletos. A grade ativa é usada também para datas anteriores; alterações posteriores da grade podem afetar relatórios antigos.

Para registrar movimentações no período da tarde, estão disponíveis os horários 13:00, 13:50, 14:40, 15:30, 16:20 e 17:00, além dos horários da manhã.
