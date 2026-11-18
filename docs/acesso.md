# Acesso ao sistema

## Finalidade

O sistema permite o acesso apenas pela tela de login, com o e-mail e a senha já cadastrados para o funcionário. Não existem rotas públicas, códigos por e-mail, tokens ou telas para recuperação de senha.

Quando uma senha precisar ser alterada, isso deve ser feito no cadastro do funcionário por uma pessoa com a permissão administrativa correspondente. Dessa forma, a troca permanece vinculada ao processo interno da escola.

No cadastro de funcionário, a senha pode ser qualquer combinação não vazia, inclusive somente números. O sistema continua armazenando-a de forma protegida e não impõe exigência de letra maiúscula, símbolo ou tamanho mínimo.

## Funcionários excluídos, troca de senha e sessão vencida

Um funcionário excluído (exclusão lógica) não consegue mais entrar, e editar o cadastro de um funcionário excluído não o reativa. A senha nova informada no cadastro é guardada com hash, como no cadastro inicial, e passa a valer no login seguinte; sem senha nova, a atual é mantida. Cadastrar, alterar e excluir funcionários é exclusivo de `Processo Pedagógico`, o mesmo cargo que vê o módulo no menu.

Quando o servidor responde `401` a uma tela já autenticada (token vencido ou inválido), a sessão salva no navegador é apagada e a tela volta para o login. A tela antiga `telaLoginChamada.html` não envia mais o formulário de forma nativa, e o link "Esqueci minha senha" orienta a procurar o Processo Pedagógico.

A cada requisição autenticada, o servidor confere no banco se o funcionário do token continua ativo e qual é o cargo dele agora. Um funcionário excluído perde o acesso na hora, mesmo com um token ainda dentro da validade, e uma troca de cargo vale já na requisição seguinte. Para não fazer uma consulta por requisição, a situação fica guardada por até 1 minuto; alterar ou excluir o funcionário apaga essa memória na hora.

As telas de módulos restritos (Alunos, Grade de Horários, Relatórios, Alertas de Faltas, Cargos e Funcionários) devolvem ao painel quem não é `Processo Pedagógico`, e todas as telas voltam ao login quando não há sessão salva. A API continua recusando por conta própria.
