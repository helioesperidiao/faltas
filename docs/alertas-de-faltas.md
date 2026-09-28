# Alertas de faltas bimestrais

## Finalidade

Ao abrir o painel com o cargo `Processo Pedagógico`, o sistema mostra um aviso com o aluno, a turma e a disciplina quando o limite de faltas do bimestre é atingido. Faltas abonadas, dispensadas ou excluídas não entram nesse aviso.

A chamada é geral, e não é feita por disciplina. Por isso, cada falta geral é cruzada com a data e a grade da turma: uma falta em uma quinta-feira é atribuída às disciplinas que ocorrem naquela quinta-feira. Dois horários consecutivos da mesma disciplina na grade representam apenas uma disciplina naquela chamada; cada registro de falta salvo para o aluno entra na contagem. O cálculo usa a data em UTC para não deslocar o dia da semana no fuso brasileiro.

Antes de cruzar a chamada com a grade, o sistema compara o identificador normalizado da turma e, se não houver uma grade com o nome idêntico, aceita as siglas legadas equivalentes `ETec` e `ECon`. Assim, por exemplo, faltas antigas de `ETecInf-3PMA` são associadas à grade importada como `EConInf-3PMA`, sem deixar os alunos fora do alerta.

O calendário padrão do sistema divide o ano em quatro períodos letivos: janeiro a março, abril a junho, agosto a setembro e outubro a novembro. Julho e dezembro são férias e não entram na contagem. A consulta também aceita ano e bimestre pela API, caso seja necessário consultar um período anterior.

## Cálculo da carga e dos limites

Cada registro da grade agora guarda a duração da aula em minutos e a carga semanal total da mesma disciplina naquela turma. Ao criar, alterar ou excluir uma aula, a soma semanal é recalculada e gravada para todas as aulas da disciplina; as grades existentes recebem esse cálculo na inicialização do sistema.

Os alertas calculados são gravados na coleção `alertasFaltas`, com o aluno, turma, disciplina, bimestre, faltas e regra que gerou o aviso. As regras ficam na coleção `configuracoesAlertasFaltas`, iniciada com 50 minutos semanais para 3 faltas e 100 minutos semanais para 5 faltas.

Na aba **Alertas de Faltas**, o cargo `Processo Pedagógico` pode alterar esses limites, cadastrar outras cargas semanais ou remover regras que não devem gerar alertas. A regra usada em cada alerta fica registrada, mesmo se a configuração for ajustada depois.
