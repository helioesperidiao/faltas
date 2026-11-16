# Testes

## Testes da tela de chamada

```bash
npm test
```

Roda `tests/*.test.mjs` com o executor nativo do Node (`node --test`), sem banco nem servidor. Cobre o seletor de turmas da chamada, a correspondência de siglas legadas, a recuperação da chamada salva pela rota `api/v1/registros` e o clique duplo em `Faltou`, que deve gerar um único registro.

## Roteiro ponta a ponta da API

```bash
npm run test:e2e
```

`tests/e2e-api.mjs` sobe o servidor de verdade num banco descartável (`faltas_teste_claude`, apagado e recriado a cada execução; o banco de `MONGO_DATABASE` não é tocado), com `TZ=America/Sao_Paulo` para expor erros de fuso, e percorre os fluxos pela API: login e erros de entrada, cargos, importação e reimportação de alunos (com arquivamento e reativação), importação e substituição da grade, chamada pelas mesmas rotas da tela, alertas bimestrais, abonos com atestado, dispensas, entradas e saídas, fechamento diário, relatórios, virada anual e permissões de funcionários. Termina conferindo que o log não teve nenhum `erro não tratado`.

Requer o MongoDB de `MONGO_URI` em execução e as variáveis `DEFAULT_ADMIN_*` do `.env`. Os anexos enviados pelo teste são apagados ao final.

Em 16/11/2026 o roteiro tinha 82 verificações: o código anterior às correções passava em 52 e o atual passa em todas.

## Lint

O script `npm run lint` chama o ESLint, que não está instalado nem configurado no projeto (ver `docs/PENDENCIAS.md`).
