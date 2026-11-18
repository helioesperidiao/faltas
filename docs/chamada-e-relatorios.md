# Chamada e relatórios

## Finalidade

A chamada considera cada aluno presente por padrão e é sempre geral para a turma, sem escolha de disciplina. A tela possui somente o botão `Faltou`: ao acioná-lo, a falta é registrada como `true`; sem acioná-lo, a presença é gravada como `false` ao concluir a chamada. Isso evita marcar presença manualmente para toda a turma e impede que uma confirmação visual seja confundida com uma chamada salva.

Ao concluir, o sistema grava tanto as faltas marcadas quanto as presenças restantes. Ao selecionar novamente a mesma turma e data, a tela restaura as marcações já salvas e reutiliza seus registros para correções, sem criar uma nova chamada. O relatório de frequência consulta esses mesmos registros, por turma e data; `Ausente` aparece em vermelho, `Presente` em verde e `Atrasado` em amarelo. Para os alertas bimestrais, uma falta geral é atribuída às disciplinas que aparecem na grade daquela turma e daquele dia da semana. Quando há uma entrada registrada, o aluno recebe falta apenas nas aulas iniciadas antes da entrada e presença nas aulas iniciadas naquele horário ou depois; uma saída antecipada segue a regra inversa. As datas são comparadas pelo dia do calendário, sem considerar o horário exato de cadastro ou alteração da turma; por isso, um aluno cadastrado no mesmo dia da chamada também aparece no painel. Na página Relatórios, cada consulta usa um combo **Selecionar turma** com as turmas dos alunos ativos. Os campos vizinhos usam os rótulos **Selecionar dia** e **Selecionar período**, mantendo os controles alinhados.

## Turmas da chamada

O seletor **Turma que está acessando** apresenta todas as turmas da escola, tiradas da coluna de turma da planilha de alunos (`TURMA_PREF` ou `TURMA`, ver `importacao-de-planilhas.md`). São as turmas distintas dos alunos ativos: cada turma aparece uma única vez, por mais alunos que tenha, e uma turma só aparece se tiver ao menos um aluno ativo (decisão do usuário em 18/11/2026; antes, as opções vinham da grade de horários). A grade de horários não define as opções da chamada; ela continua sendo usada para os alertas e o fechamento diário. As opções são agrupadas pelo nome, com os números em ordem crescente dentro de cada grupo (por exemplo, `1adm`, `2adm`, `3adm`, `1quim`, `2quim`).

Ao selecionar uma turma, a tela lista exatamente os alunos ativos cujo cadastro tem aquela turma: com 20 alunos no `2A` e 10 no `2C`, escolher `2A` mostra os 20 e escolher `2C` mostra os 10. O nome é comparado como está na planilha (sem os espaços em volta); grafias diferentes, como `2A` e `2 A`, viram turmas diferentes, e a correção é feita na planilha ou no cadastro. Um aluno gravado com acento corrompido (`AdministraÃ§Ã£o-1A`) entra na turma com o nome corrigido (`Administração-1A`), como nos relatórios. A falta gravada leva a turma do cadastro do aluno, que é a turma selecionada, e é por ela que a chamada salva é recuperada e os relatórios consultam. Se os alunos ou a chamada salva não puderem ser carregados, a tela não permite iniciar a chamada.

## Gravação e correção da chamada

A chamada geral é uma por aluno e por dia. A tela grava um aluno de cada vez: um segundo clique em `Faltou` enquanto a gravação anterior ainda está em andamento é ignorado, e o envio seguinte do mesmo aluno espera o primeiro terminar para corrigir o registro já criado. No servidor, um novo envio da chamada geral para um aluno e dia que já têm registro corrige esse registro em vez de criar outro, de modo que alertas e relatórios nunca contam a mesma falta duas vezes.

Corrigir a chamada altera apenas presença, atraso e acompanhante. A situação `Abonada` ou `Dispensada` pertence aos fluxos de abono e dispensa e é mantida na correção.

## Consultas dos relatórios

Os relatórios exigem a turma e datas no formato `AAAA-MM-DD`; consulta sem turma, com data inválida, com período invertido ou com ano e mês fora do intervalo responde `400` com a mensagem do campo, em vez de devolver uma lista vazia. Os dias são comparados à meia-noite UTC, como são gravados pela chamada: o mês de março vai de `01/03` a `31/03` inteiros, sem puxar o dia 1º do mês seguinte quando o servidor roda no fuso de Brasília.

O total de faltas por semana, mês ou período desconta as faltas abonadas e dispensadas, como já faziam os alertas e o fechamento. As entradas e saídas do intervalo consultado são lidas por completo; a listagem de movimentações continua limitada às 200 mais recentes apenas na tela.

## Data de entrada na turma

O aluno só recebe chamada a partir do dia em que entrou na turma, e a frequência e os relatórios se baseiam nesse dia (decisão do usuário em 17/11/2026). Aluno cadastrado no meio do ano não tem presença nem falta nos dias anteriores ao cadastro: a tela de chamada não o lista em datas anteriores e avisa quantos ficaram de fora, e a API recusa com `400` uma chamada nova para antes da entrada. O dia de entrada é o dia do calendário de Brasília: quem é cadastrado às 22h entra naquele mesmo dia, e não no seguinte (como acontecia ao comparar em UTC). Na virada anual, a entrada na turma nova é o dia da troca; os dias anteriores continuam na turma antiga.

## Limpar chamada

"Limpar chamada" volta todos para presente na tela e também no banco: as faltas já salvas daquela turma e data são corrigidas para presença, pela mesma fila de gravação por aluno usada pelo botão `Faltou`.

Cada gravação guarda o aluno, a data e a chamada do momento do clique. Se o professor navega para outro aluno, limpa a chamada ou troca a turma ou a data enquanto uma gravação está em andamento, ela termina na chamada certa, e a tela não avança nem desfaz o aluno errado.
