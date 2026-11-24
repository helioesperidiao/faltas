# Turmas da chamada vindas da planilha de alunos

## Skills e comandos invocados

- `/aura-retomar-execucao:aura` (protocolo-tarefa-complexa + diagnosing-bugs + modo-loop-verificacao + graphify).

## O que foi pedido

1. Há um erro na aba **Chamada**, no campo **Selecionar a turma**.
2. O campo deve conter **todas as turmas da escola**.
3. As turmas são descobertas na **importação de alunos**: a planilha tem a coluna de turma; ler a planilha e
   resgatar todas as turmas que aparecem nela.
4. Turma que já foi registrada **não se repete** no seletor.
5. **Todos os alunos** daquela turma ficam vinculados a ela (ex.: 10 alunos do 2º C e 20 do 2º A → o seletor
   mostra `2º A` e `2º C`; ao escolher `2º A` aparecem os 20 alunos do 2º A; ao escolher `2º C`, os 10 do 2º C).
6. Vale para Excel ou qualquer arquivo enviado na importação.
7. Quando o aluno recebe falta, a falta fica **vinculada à turma selecionada**.

## Objetivo

O seletor da chamada lista, sem repetição, as turmas dos alunos ativos (as que vieram da última planilha
importada ou do cadastro), e cada turma abre exatamente os alunos dela; a falta gravada leva essa turma.

## Diagnóstico inicial

Hoje (`src/public/telaChamada.html` + `src/public/js/TurmasChamada.mjs`) o seletor lista as turmas da
**grade de horários**, não as dos alunos. Turma que está só na planilha de alunos não aparece, e o nome da grade
precisa casar com o do aluno. A regra veio do commit `9f215f2` (14/11); não há decisão do usuário registrada
sobre ela em `docs/`, `docs/PENDENCIAS.md` nem nos chats recentes.

## Restrições

- Mudança mínima; preservar a gravação da chamada, "Limpar chamada", data de entrada na turma e a importação.
- Não apagar dados; a importação continua igual (ela já grava a coluna `TURMA_PREF`/`TURMA` em `aluno.turma`).

## Checklist

- [x] Teste vermelho: seletor usa turmas dos alunos, sem repetir, e turma da grade sem aluno não aparece
  (`tests/turmas-chamada.test.mjs`; vermelho mostrou `['EConInf-3PMA','Outra']` no lugar de `['2A','2C']`).
- [x] Seletor da chamada passa a usar as turmas dos alunos ativos (`turmasDosAlunos` em `src/public/js/TurmasChamada.mjs`,
  `carregarTurmas` em `src/public/telaChamada.html`); a função antiga `vincularTurmasDaGrade` saiu.
- [x] Selecionar uma turma carrega só os alunos dela, inclusive turma gravada com acento corrompido
  (`AlunoDAO.findAtivosPorTurma`, usado por `AlunoService.findByTurma`; e2e vermelho `→ []` antes, verde depois).
- [x] Falta gravada com a turma do aluno = turma selecionada (`RegistroService`: `registro.turma = aluno.turma`).
- [x] `npx tsc --noEmit` ok · `npm test` 22/22 · `npm run test:e2e` 99/99 · `npm run test:integracao` 17/17.
- [x] Docs: `chamada-e-relatorios.md`, `turmas-e-historico.md`, `importacao-de-planilhas.md`, `testes.md`, `README`,
  `PENDENCIAS.md` (P-017, teste no navegador com a planilha real); `src/consolidado.txt` regenerado.
- [x] Loop de verificação: 3 voltas. Volta 1 achou a turma com acento corrompido que abria vazia (corrigido).
  Volta 2 achou escapes Unicode gravados como caracteres literais (restaurados). Volta 3 sem achados.

## Estado

- Concluído e verificado. Nada commitado (aguarda pedido do usuário).
- Grafo do código: `Mateus-Projects/Claude-HTML/faltas/graphify/graph.html`.
