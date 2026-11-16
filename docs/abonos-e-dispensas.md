# Abonos e dispensas

## Abonos

`Inspetor` e `Processo Pedagógico` solicitam e corrigem abonos; somente `Processo Pedagógico` aprova, rejeita e exclui. Ao aprovar, as faltas do aluno no período passam para a situação `Abonada` e deixam de contar em alertas, relatórios e no fechamento diário.

A data final precisa ser igual ou posterior à inicial; um período invertido é recusado com `400`.

Corrigir um abono devolve-o para análise (`Pendente`) e mantém o atestado já anexado, porque a tela de correção não reenvia o arquivo. Se o abono estava aprovado, as faltas que ele havia convertido voltam para `Normal` até a nova aprovação. Excluir um abono aprovado faz o mesmo. As datas da listagem são exibidas no mesmo dia do calendário em que foram gravadas.

## Dispensas

A dispensa vale para uma disciplina (`cod`), um aluno (`idAluno`, o identificador do cadastro) e um intervalo de datas (`dia` a `dataFim`). Os horários `horaInicio` e `horaFim` são horas inteiras de 0 a 23. Ainda não há tela própria: as dispensas são cadastradas pela API `/api/v1/dispensas`.

Como a chamada é geral, a dispensa é aplicada por disciplina nos cálculos: uma aula dispensada fica fora dos alertas bimestrais e dos arquivos CSV do fechamento, enquanto as outras disciplinas do mesmo dia continuam contando. Corrigir uma dispensa sem enviar um novo anexo mantém o arquivo já enviado.

## Anexos

Atestados de abono e documentos de dispensa aceitam `.jpg`, `.jpeg` e `.pdf` de até 10 MB e são gravados em `uploads/abono` e `uploads/dispensa` com o identificador do registro como nome. O identificador da rota é validado antes de qualquer gravação: um valor que não seja um identificador válido, ou um arquivo de outro tipo, é recusado com `400`, e nenhum arquivo é gravado fora dessas pastas. Na tela de abonos, se o atestado não puder ser anexado, a mensagem avisa que o abono foi salvo sem o arquivo.
