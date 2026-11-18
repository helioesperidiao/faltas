# Configuração (.env)

## Arquivo de variáveis

O `.env` não é versionado. Para configurar uma máquina, copie o modelo e preencha os valores:

```bash
cp .env.example .env
```

O código não tem valores de reserva para segredos. Sem `JWT_SECRET`, o servidor não sobe e o log diz qual variável falta. `DEFAULT_ADMIN_EMAIL` e `DEFAULT_ADMIN_PASSWORD` só são exigidos enquanto o banco não tem nenhum funcionário, porque servem para criar o primeiro acesso de Processo Pedagógico. `DEFAULT_ADMIN_NAME` usa "Administrador" se ficar vazio. As variáveis do MongoDB (`MONGO_URI`, `MONGO_DATABASE`) continuam com os padrões `mongodb://localhost:27017` e `faltas_cti`.

## Quem já tinha o projeto

Até 17/11/2026 o `.env` era versionado. O commit que deixou de versioná-lo faz o Git **apagar o `.env` local** de quem atualizar a branch (`git pull`, merge ou troca de branch). Antes de atualizar, guarde uma cópia do seu `.env`; depois, coloque-a de volta na raiz do projeto ou recrie a partir do `.env.example`.

Os valores antigos continuam no histórico do Git. Por decisão do usuário (17/11/2026), eles não foram trocados; o `.env` local manteve os mesmos valores.

## Erros de inicialização

Qualquer falha ao iniciar (variável ausente, MongoDB fora do ar) aparece no log como `falha ao iniciar o servidor: <motivo>`, e o processo termina com código 1.
