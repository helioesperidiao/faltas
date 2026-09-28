/**
 * Vínculo de um aluno com uma turma que já foi encerrado.
 *
 * Os dados não dependem da turma atual do aluno. Assim, relatórios de um ano
 * anterior continuam identificando corretamente a turma e a série cursadas.
 */
export interface HistoricoTurma {
    turma: string;
    curso: string;
    serie: string;
    ano: string;
    inicioEm: Date;
    fimEm: Date;
    disponivelAte: Date;
}
