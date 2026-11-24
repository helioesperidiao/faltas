# Testes do projeto

## Testes automatizados

Execute `npm run build` e depois `node --test tests/abonos-csv.test.cjs tests/fechamento.test.cjs tests/turmas-chamada.test.mjs tests/importacao.test.mjs` para verificar o fechamento, o CSV de abonados e o fechamento diário. Esses testes não precisam de banco de dados.
```bash
npm test
```

Roda `tests/*.test.mjs` com o executor nativo do Node (`node --test`), sem banco nem servidor. Verifica a associação de turmas da chamada e a leitura de planilhas CSV e Excel (inclusive células com quebra de linha e linhas vazias, em `tests/importador-csv.test.mjs`), além de "Limpar chamada" no banco, a chamada sem alunos que entraram depois da data, a gravação que não muda de aluno nem de chamada quando o professor navega, e o CSV com aspa sem par. Cobre o seletor de turmas da chamada (as turmas vêm dos alunos, sem repetir, e cada turma abre só os seus alunos: 20 do `2A` e 10 do `2C`), a recuperação da chamada salva pela rota `api/v1/registros` e o clique duplo em `Faltou`, que deve gerar um único registro. Esses testes não precisam de banco de dados.

## Integração com o servidor compilado

A integração usa o servidor compilado e um MongoDB separado, em portas locais escolhidas na execução e com dados fictícios. No Windows, informe o caminho do executável do MongoDB e execute:

```powershell
npm run build
$env:MONGOD_BINARY = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
node --test tests/fechamento-integracao.test.cjs
node --test tests/integracao-api.test.cjs
```

O teste cria uma pasta temporária para o banco e os logs, inicializa os processos de teste e os encerra ao final. Ele não usa a base configurada no `.env`. Os cenários exercitam autenticação, páginas disponíveis, funcionários, cargos, alunos, grade, chamada, relatórios, entradas e saídas, abonos, dispensas, alertas, importação e exclusão lógica. A chamada e a edição da grade também são simuladas usando os scripts das próprias telas conectados à API real.

Essas simulações não substituem a conferência no navegador e no ambiente da escola, nem cobrem todas as combinações de dados, permissões, arquivos e dispositivos. O MongoDB deve estar instalado e a abertura de portas locais deve estar disponível para executar a integração.

## Roteiro ponta a ponta da API

```bash
npm run test:e2e
```

`tests/e2e-api.mjs` sobe o servidor de verdade (sem compilar, via `ts-node`) num banco descartável (`faltas_teste_claude`, apagado e recriado a cada execução; o banco de `MONGO_DATABASE` não é tocado), com `TZ=America/Sao_Paulo` para expor erros de fuso, e percorre os fluxos pela API: login e erros de entrada, cargos, importação e reimportação de alunos (com arquivamento e reativação), importação e substituição da grade, chamada pelas mesmas rotas da tela, alertas bimestrais, abonos com atestado, dispensas, entradas e saídas, fechamento diário, relatórios, virada anual e permissões de funcionários. Termina conferindo que o log não teve nenhum `erro não tratado`.

Requer o MongoDB de `MONGO_URI` em execução e as variáveis `DEFAULT_ADMIN_*` do `.env`. Os anexos enviados pelo teste são apagados ao final.

Em 16/11/2026 o roteiro tinha 82 verificações: o código anterior às correções passava em 52 e o atual passa em todas. Em 18/11/2026 passou a ter 99, com as turmas da chamada vindas da planilha (cada turma uma vez e com exatamente os seus alunos, inclusive turma gravada com acento corrompido); antes disso tinha 97, com a gravação dos alertas só quando mudam e as regressões da revisão final (cargos com nome fixo, anexo em abono aprovado, reversão de abono, e-mail recadastrado, turma com acento corrompido); em 17/11/2026 tinha 89, incluindo o boot sem `JWT_SECRET`, o token de funcionário excluído, a chamada antes da entrada na turma, abonos sobrepostos e o cadastro manual de matrícula arquivada.

Na integração (`npm run test:integracao`), o aluno do roteiro passa a entrar na turma no início do ano letivo, porque as datas do roteiro são fixas (16 e 17/11/2026) e o aluno só conta a partir da entrada. Com isso, os 17 cenários passam em qualquer dia.

## Lint

O projeto não tem ESLint. Os scripts `lint` e `lint:fix`, que chamavam o ESLint sem ele estar instalado, foram removidos por decisão do usuário (17/11/2026). A verificação estática é a do TypeScript (`npx tsc --noEmit`).
