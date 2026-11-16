# Pendências

## Abertas

- **P-001** · 2026-11-16 · Segredos no repositório. O `.env` está versionado com a senha do admin padrão e o `JWT_SECRET`, e o código tem valores fixos de reserva para os dois (`src/services/FuncionarioService.ts`, `initializeDefaultAdmin`; `src/http/MeuTokenJWT.ts`). Quem lê o repositório pode entrar como Processo Pedagógico ou forjar tokens. Não foi mexido porque trocar senha e segredo afeta o ambiente real: precisa de decisão do usuário (tirar o `.env` do Git, trocar os valores e falhar o boot sem as variáveis).
- **P-002** · 2026-11-16 · Token de funcionário excluído continua válido até expirar (60 dias). O login já recusa o excluído, mas o `JwtMiddleware` não consulta o banco e não confere `iss`/`aud`. Precisa decidir entre checar o funcionário ativo a cada requisição ou reduzir a validade do token.
- **P-003** · 2026-11-16 · Chamada retroativa de lista recém-importada não aparece nos relatórios. `AlunoDAO.findByTurmaNoPeriodo` só considera o aluno a partir de `turmaInicioEm` (data da importação); uma chamada lançada para uma data anterior grava os registros, mas frequência e relatórios do período não mostram esses alunos. É regra de negócio: decidir se a importação inicial deve valer desde o início do ano letivo.
- **P-004** · 2026-11-16 · `npm run lint` chama o ESLint, que não está instalado nem configurado.
- **P-005** · 2026-11-16 · Desempenho dos relatórios: cada consulta carrega todos os registros, a grade e os alunos (`findAll`), e o alerta bimestral é recalculado e regravado em `alertasFaltas` a cada abertura do painel; não há índice único em matrícula nem em alertas. Funciona no volume atual, mas cresce com o ano letivo.
- **P-006** · 2026-11-16 · Telas abertas sem sessão: Alunos, Grade, Relatórios, Abonos, Funcionários e Movimentações leem `userData.data.token` antes do redirecionamento e mostram `TypeError` no console; as páginas restritas só somem do menu (a API é que bloqueia). Trocar pelo `exigirSessao()` que Cargos e Chamada já usam.
- **P-007** · 2026-11-16 · Importação CSV: célula entre aspas com quebra de linha divide a linha da planilha (`ImportadorCsv.js` separa por linha antes de ler as aspas).
- **P-008** · 2026-11-16 · "Limpar chamada" só limpa a tela; os registros já gravados continuam com as faltas até a chamada ser concluída de novo.
- **P-009** · 2026-11-16 · Abonos: aprovar não é atômico, faltas lançadas depois da aprovação não viram `Abonada`, e com dois abonos aprovados sobrepostos, excluir um devolve para `Normal` faltas também cobertas pelo outro.
- **P-010** · 2026-11-16 · Cadastro manual de aluno com matrícula arquivada cria um segundo cadastro (a importação já reativa o arquivado).
- **P-011** · 2026-11-16 · Dispensas não têm tela; o cadastro é só pela API `/api/v1/dispensas`.

## Resolvidas

Nenhuma ainda. Os 28 bugs corrigidos na auditoria de 16/11/2026 estão em `docs/BUG_AUDIT.md`.
