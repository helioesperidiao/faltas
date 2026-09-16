import { MongoDatabase } from "@/database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export interface DadosAlertaFalta {
    matricula: string;
    alunoNome: string;
    turma: string;
    codDisciplina: string;
    disciplina: string;
    totalFaltas: number;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}
export declare class AlertaFaltaDAO {
    private readonly database;
    constructor(database: MongoDatabase);
    private collection;
    sincronizar(ano: number, bimestre: number, alertas: DadosAlertaFalta[], funcionario: Funcionario): Promise<void>;
}
//# sourceMappingURL=AlertaFaltaDAO.d.ts.map