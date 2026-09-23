import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
export interface FrequenciaAluno {
    matricula: string;
    alunoNome: string;
    situacao: string;
    movimentacao: {
        tipo: string;
        horario: string;
    } | null;
}
export interface FaltasPorAluno {
    matricula: string;
    alunoNome: string;
    totalFaltas: number;
    movimentacao: {
        tipo: string;
        horario: string;
    } | null;
}
export declare class RelatorioService {
    private _alunoDAO;
    private _registroDAO;
    private _movimentacaoDAO;
    constructor(alunoDAODependency: AlunoDAO, registroDAODependency: RegistroDAO, movimentacaoDAODependency: MovimentacaoDAO);
    private mesmaData;
    private chaveData;
    private faltaConsiderandoMovimentacao;
    private ultimaMovimentacao;
    frequenciaPorTurma: (turma: string, dia: Date) => Promise<FrequenciaAluno[]>;
    faltasPorTurmaEPeriodo: (turma: string, dataInicio: Date, dataFim: Date) => Promise<FaltasPorAluno[]>;
    faltasPorTurmaSemana: (turma: string, data: Date) => Promise<FaltasPorAluno[]>;
    faltasPorTurmaMes: (turma: string, ano: number, mes: number) => Promise<FaltasPorAluno[]>;
}
//# sourceMappingURL=RelatorioService.d.ts.map