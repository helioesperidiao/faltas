import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { Funcionario } from "@/models/Funcionario";
import { ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { AlertaFaltaDAO } from "@/dao/AlertaFaltaDAO";
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
export interface AlertaFaltaBimestral {
    matricula: string;
    alunoNome: string;
    turma: string;
    codDisciplina: string;
    disciplina: string;
    totalFaltas: number;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}
export interface AlertasFaltaBimestral {
    ano: number;
    bimestre: number;
    dataInicio: Date;
    dataFim: Date;
    alertas: AlertaFaltaBimestral[];
}
export declare class RelatorioService {
    private _alunoDAO;
    private _registroDAO;
    private _movimentacaoDAO;
    private _gradeHorarioDAO;
    private _configuracaoAlertaFaltaDAO;
    private _alertaFaltaDAO;
    constructor(alunoDAODependency: AlunoDAO, registroDAODependency: RegistroDAO, movimentacaoDAODependency: MovimentacaoDAO, gradeHorarioDAODependency: GradeHorarioDAO, configuracaoAlertaFaltaDAODependency: ConfiguracaoAlertaFaltaDAO, alertaFaltaDAODependency: AlertaFaltaDAO);
    private mesmaData;
    private chaveData;
    private faltaConsiderandoMovimentacao;
    private ultimaMovimentacao;
    private normalizarDiaSemana;
    private diaSemanaDaData;
    private normalizarTurma;
    private normalizarTurmaEquivalente;
    frequenciaPorTurma: (turma: string, dia: Date) => Promise<FrequenciaAluno[]>;
    faltasPorTurmaEPeriodo: (turma: string, dataInicio: Date, dataFim: Date) => Promise<FaltasPorAluno[]>;
    faltasPorTurmaSemana: (turma: string, data: Date) => Promise<FaltasPorAluno[]>;
    faltasPorTurmaMes: (turma: string, ano: number, mes: number) => Promise<FaltasPorAluno[]>;
    alertasFaltaBimestral: (ano: number, bimestre: number, funcionarioLogado: Funcionario) => Promise<AlertasFaltaBimestral>;
}
//# sourceMappingURL=RelatorioService.d.ts.map