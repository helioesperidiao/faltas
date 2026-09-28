# Chamada e relatórios

## Finalidade

A chamada considera cada aluno presente por padrão e é sempre geral para a turma, sem escolha de disciplina. A tela possui somente o botão `Faltou`: ao acioná-lo, a falta é registrada como `true`; sem acioná-lo, a presença é gravada como `false` ao concluir a chamada. Isso evita marcar presença manualmente para toda a turma e impede que uma confirmação visual seja confundida com uma chamada salva.

Ao concluir, o sistema grava tanto as faltas marcadas quanto as presenças restantes. Ao selecionar novamente a mesma turma e data, a tela restaura as marcações já salvas e reutiliza seus registros para correções, sem criar uma nova chamada. O relatório de frequência consulta esses mesmos registros, por turma e data; `Ausente` aparece em vermelho e `Presente` em verde. Para os alertas bimestrais, uma falta geral é atribuída às disciplinas que aparecem na grade daquela turma e daquele dia da semana. As datas são comparadas pelo dia do calendário, sem considerar o horário exato de cadastro ou alteração da turma; por isso, um aluno cadastrado no mesmo dia da chamada também aparece no painel. Na página Relatórios, as turmas são escolhidas na lista dos alunos ativos, da mesma maneira que na tela de chamada.
