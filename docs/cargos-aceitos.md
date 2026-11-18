# Cargos aceitos

## Finalidade

O sistema aceita somente os cargos `Inspetor` e `Processo Pedagógico`. A validação acontece no servidor ao criar ou alterar funcionários e cargos, portanto não pode ser contornada por uma alteração no navegador. Os cargos têm nome fixo: não é possível criar cargo com outro nome nem renomear um cargo existente, porque o código compara o nome exato e quem ocupa o cargo perderia o acesso.

Na inicialização, a versão antiga `Processos Pedagógicos` é renomeada para `Processo Pedagógico`. Os demais cargos são desativados de forma lógica e deixam de aparecer nos formulários. Nenhum registro histórico é apagado.

## Permissões preservadas

### `Inspetor`

Mantém as permissões que já possuía, inclusive criar e corrigir solicitações de abono. Os módulos restritos continuam indisponíveis para esse cargo.

### `Processo Pedagógico`

Mantém o acesso total já existente no menu da aplicação, inclusive os módulos restritos. Também assume as operações administrativas que antes dependiam dos cargos removidos, inclusive criar, alterar e excluir cargos, e a gestão de alunos, grade, virada anual e análise de abonos. A alteração padroniza o nome do cargo no singular.
