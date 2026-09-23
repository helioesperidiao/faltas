# Exclusão de registros

## Como funciona

Funcionários, cargos, alunos, abonos, horários, registros e dispensas usam exclusão lógica. O registro não é apagado fisicamente: recebe a data e o responsável pela exclusão na auditoria. Assim, os dados necessários para histórico e rastreabilidade continuam preservados.

Depois de excluir, a tela consulta novamente o servidor antes de informar sucesso. O item deve desaparecer da listagem ativa; se a exclusão ou a atualização da lista falhar, a tela mostra o erro em vez de confirmar uma operação que não ocorreu.

Uma exclusão lógica não pode ser repetida. Uma nova tentativa para um item já inativo é tratada como item não encontrado, evitando mensagens de sucesso incorretas.

## Telas abrangidas

As telas de Funcionários, Cargos, Alunos, Abonos e regras de Alertas de Faltas atualizam suas listagens após a exclusão. Em Abonos, a sequência de trabalho é Solicitação, Filtro e Listagem.
