# Finalizar as pendências e enviar a main

## Skills e comandos invocados

- `/aura-retomar-execucao:aura` (protocolo-tarefa-complexa + diagnosing-bugs + modo-loop-verificacao + graphify).

## O que foi pedido

1. Finalizar todas as pendências do projeto (`docs/PENDENCIAS.md`).
2. Enviar todos os commits e fazer os pushes na `main` do repositório.
3. A autora dos commits é **só Luana Pinheiro** — sem Claude (sem `Co-Authored-By`) e sem o Mateus. Vale sempre,
   neste projeto e neste repositório.
4. Perguntar ao usuário qualquer decisão necessária durante a tarefa.

## Objetivo

`docs/PENDENCIAS.md` sem itens que a IA possa resolver, e a `main` do GitHub (`helioesperidiao/faltas`) igual à
`main` local, com todos os commits de autoria só de Luana Pinheiro.

## Restrições

- Não criar branch nova nem enviar branch de trabalho; entregar na `main` (memória `entregar-na-main-como-luana`).
- Commit sem linha de co-autor de IA; não usar `--author` nem trocar o `git config`.
- Reescrever histórico já publicado só com confirmação explícita, `--force-with-lease` e backup local
  (regra global "Commits e pushes").
- Apagar repositório (fork) é irreversível: só com confirmação.

## Decisões do usuário (19/11/2026)

- Push com a credencial LuanaPin-Cruz já guardada no Git (a conta ativa no `gh`, Todeschiniii, só tem leitura no original).
- P-016: o usuário libera o escopo `delete_repo` e a IA apaga o fork.
- Apagar a branch local `backup/antes-da-reescrita-2026-11-18`.

## Checklist

- [x] Levantar o estado: `origin/main` já era o histórico reescrito (`fff622b`, push forçado de 18/11 01h13), sem
  commits do Mateus e sem co-autor; a `main` local tinha esse histórico mais o antigo por baixo (8 commits à frente).
- [x] P-015: `main` local alinhada (`git reset --hard origin/main`) e correção das turmas reaplicada (`e0b5548`,
  autor e committer Luana Pinheiro, código idêntico ao `4953a31`); branch de backup apagada.
- [ ] P-016: aguardando o usuário liberar `delete_repo`.
- [x] P-017: testado no navegador embutido com a planilha fictícia num banco descartável (30 turmas, cada uma uma
  vez; turma de 3 alunos abriu com 3; falta gravada na turma selecionada; sem erros). Banco e senha de teste apagados.
- [x] Testes em `e0b5548`: `npx tsc --noEmit` ok · `npm test` 22/22 · `npm run test:e2e` 99/99 ·
  `npm run test:integracao` 17/17.
- [ ] Envio da `main` (push normal, sem forçar) e conferência no GitHub.
- [x] `docs/PENDENCIAS.md` atualizado (P-015 e P-017 resolvidas, P-016 aberta).

## Estado

- Falta: o push e a P-016.
