# Testes do projeto

## Testes automatizados

Execute `npm run build` e depois `node --test tests/abonos-csv.test.cjs tests/fechamento.test.cjs tests/turmas-chamada.test.mjs tests/importacao.test.mjs` para verificar o fechamento, a associação de turmas e a leitura de planilhas. Esses testes não precisam de banco de dados.

A integração usa o servidor compilado e um MongoDB separado, em portas locais escolhidas na execução e com dados fictícios. No Windows, informe o caminho do executável do MongoDB e execute:

```powershell
npm run build
$env:MONGOD_BINARY = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
node --test tests/fechamento-integracao.test.cjs
node --test tests/integracao-api.test.cjs
```

O teste cria uma pasta temporária para o banco e os logs, inicializa os processos de teste e os encerra ao final. Ele não usa a base configurada no `.env`. Os cenários exercitam autenticação, páginas disponíveis, funcionários, cargos, alunos, grade, chamada, relatórios, entradas e saídas, abonos, dispensas, alertas, importação e exclusão lógica. A chamada e a edição da grade também são simuladas usando os scripts das próprias telas conectados à API real.

Essas simulações não substituem a conferência no navegador e no ambiente da escola, nem cobrem todas as combinações de dados, permissões, arquivos e dispositivos. O MongoDB deve estar instalado e a abertura de portas locais deve estar disponível para executar a integração.
