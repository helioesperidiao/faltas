# Erros da API

Todas as respostas seguem o formato de `StandardResponse` (`success`, `message`, `data` ou `error`). O tratamento central fica em `setupErrorMiddleware`, em `src/Server.ts`.

| Situação | Código | Exemplo |
| --- | --- | --- |
| Erro de negócio (`ErrorResponse`) | o informado | permissão negada → `403`; registro inexistente → `404` |
| Validação de campo nos models | `400` | matrícula com mais de 8 caracteres, e-mail em formato inválido no login, data inválida |
| Identificador que não é ObjectId | `400` | `GET /api/v1/alunos/xyz` |
| JSON malformado no corpo | `400` | corpo cortado ou com sintaxe inválida |
| Upload fora das regras | `400` ou `413` | tipo de arquivo não aceito → `400`; arquivo acima de 10 MB → `413` |
| Corpo JSON acima de 10 MB | `413` | importação muito grande |
| Qualquer outro erro | `500` | falha inesperada, registrada no log como `erro não tratado` |

Os setters dos models lançam `ErrorResponse(400, …)`; por isso uma entrada inválida enviada por um cliente vira `400` com a mensagem do campo, e não `500`. O roteiro `npm run test:e2e` termina com uma verificação de que nenhuma requisição gerou `erro não tratado` no log.
