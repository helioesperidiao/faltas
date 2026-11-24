# Desempenho dos relatórios

## Como foi medido

Benchmark em 17/11/2026, com o servidor real e um MongoDB 9.0.4 local, num banco descartável com 1.000 alunos em 25 turmas, 750 aulas na grade, 80 dias letivos (80 mil registros de chamada, 6% de faltas) e 3 mil entradas e saídas. Cada rota foi chamada 6 vezes; a primeira aquece e o número é a mediana das outras. As respostas de todas as rotas foram comparadas antes e depois e ficaram idênticas, inclusive os 2.437 alertas do 1º bimestre e os 1.903 do 2º.

## Resultado

| Rota | Antes | Depois |
|---|---|---|
| Alertas do 1º bimestre (abre junto com o painel do Processo Pedagógico) | 41,9 s | ~0,9 s |
| Alertas do 2º bimestre | 26,2 s | ~0,7 s |
| Faltas no período (fev a mai) | 3,3 s | ~0,1 s |
| Faltas no mês | 1,46 s | ~0,05 s |
| Fechamento do dia | 1,71 s | ~0,49 s |
| Frequência por turma | 1,17 s | ~0,02 s |
| Chamada, listar alunos, gravar chamada | < 35 ms | < 35 ms |

## O que mudou

O custo era de processamento no serviço, não do banco. Para cada registro de chamada, o cálculo percorria a grade inteira, normalizando o texto de turma e dia a cada comparação, e todas as movimentações, convertendo cada data em texto.

1. **Índices por consulta** (`RelatorioService`): a grade é indexada por dia (com turma já normalizada) e as movimentações por aluno e dia, uma vez por requisição. O índice fica num `WeakMap` cuja chave é a própria lista carregada do banco, então não existe cache entre consultas nem risco de dado velho.
2. **Leitura só do necessário** (`RegistroDAO.findNoPeriodo`, `findDoDia`, `findFaltasQueContam` e `AlunoDAO.findByTurmaNoPeriodo`): cada relatório pede ao banco só o período, o dia ou a turma de que precisa, em vez da coleção inteira.
3. **Alertas**: uma presença só vira falta se houver saída antecipada no dia, então são lidos apenas as faltas e os registros de quem teve saída no período (`findFaltasOuDasMatriculasNoPeriodo`).
4. **Alertas gravados só quando mudam** (`AlertaFaltaDAO.sincronizar`, 18/11/2026): a consulta compara o cálculo com o que já está em `alertasFaltas` e grava apenas alertas novos ou diferentes, e desativa os que sumiram. Antes, regravava todos (2.437 no teste) a cada abertura do painel.
5. **Índices no MongoDB**: `registro {dia}`, `registro {matricula, dia}` e `aluno {historicoTurmas.turma}`, criados no boot junto com os já existentes.

## O que ficou

O fechamento do dia ainda devolve `faltasHistoricas` com todas as faltas de todos os tempos; o campo foi mantido por decisão do usuário (P-013), mesmo sem uso nas telas.
