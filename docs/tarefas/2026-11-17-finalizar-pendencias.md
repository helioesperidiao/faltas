# Finalizar todas as pendências — 17/11/2026

## Skills e comandos invocados

- `/aura-retomar-execucao:aura` (protocolo-tarefa-complexa, diagnosing-bugs, modo-loop-verificacao, graphify).
- `refutar-projeto` (pedida pelo usuário para refutações).
- `otimizar-projeto` (pedida pelo usuário para otimizar o código).

## O que foi pedido, item por item

1. Finalizar todas as pendências, para poder fechar o chat.
2. Para decisões importantes, fazer perguntas durante a execução.
3. Havendo alguma refutação, fazer o mesmo (perguntar), usando a skill `refutar-projeto`.
4. Para otimizar o código, usar a skill `otimizar-projeto`.

## Objetivo

`docs/PENDENCIAS.md` sem itens abertos que dependam de trabalho (cada um resolvido e verificado, ou encerrado por
decisão do usuário com o motivo), o código otimizado sem mudar comportamento, e tudo validado e documentado.

## Restrições

- Não mudar regra de negócio sem perguntar; decisões importantes vão ao usuário.
- Não apagar dados reais; testes só em bancos descartáveis.
- Preservar o trabalho da colega (`tests/integracao-api.test.cjs`, `tests/importacao.test.mjs`).
- Otimização não muda comportamento.

## Decisões do usuário (17/11/2026)

- `refutar-projeto` só pode ser invocada pelo usuário (`disable-model-invocation`); fica para ele rodar `/my-skills:refutar-projeto`.
- P-001: **só tirar do Git** — parar de versionar o `.env`, criar `.env.example`, remover os valores fixos de reserva do código; os valores atuais continuam no `.env` local.
- P-002: **conferir no banco** a cada requisição se o funcionário está ativo (cache curto).
- P-003: o aluno cadastrado no meio do ano **não recebe presença nos dias anteriores**; conta a partir do dia em que entrou, e a frequência se baseia nesse dia. → manter a regra, corrigir o fuso (dia de Brasília) e a chamada não listar aluno antes da entrada.
- P-008: "Limpar chamada" **grava no banco**.
- P-011 (tela de dispensas) e P-004 (instalar ESLint): **não fazer**; remover o script `lint` quebrado e encerrar as duas por decisão.

## Checklist

- [x] Refutação: `refutar-projeto` não pode ser invocada pela IA; decisões levadas ao usuário por pergunta
- [x] P-001 a P-011 resolvidas ou encerradas por decisão (ver `docs/PENDENCIAS.md`)
- [x] Otimização (`otimizar-projeto`): medida antes e depois, respostas idênticas (`docs/desempenho.md`)
- [x] Validação: `tsc`, `npm test` 18/18, `npm run test:e2e` 89/89, `npm run test:integracao` 17/17, navegador
- [x] Docs, pendências e auditoria atualizados
- [x] Commit, `main` e fork (com restauração do `.env` da pasta principal) — autorizado pelo usuário ("Sim, tudo")

## Estado

- `npx tsc --noEmit`: sem erros.
- `npm test`: 18/18 (testes novos de P-007, P-008 e P-003 ficaram vermelhos com o código anterior).
- `npm run test:e2e`: 89/89.
- `npm run test:integracao` (da colega): 17/17 (antes: 15/17).
- Navegador: sem sessão vai ao login; Inspetor volta ao painel nas telas restritas; Processo Pedagógico abre todas com dados.
- Benchmark (80 mil registros): alertas 41,9 s → ~1,3 s; frequência 1,17 s → ~0,02 s; respostas idênticas.
- Novas pendências opcionais P-012 a P-014 (decisão do usuário).
