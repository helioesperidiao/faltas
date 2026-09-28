import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { GradeHorario } from "../models/GradeHorario";
import { Funcionario } from "@/models/Funcionario";
export declare class GradeHorarioService {
    private _gradeHorarioDAO;
    constructor(gradeHorarioDAODependency: GradeHorarioDAO);
    create: (grade: GradeHorario, funcionarioLogado: Funcionario) => Promise<GradeHorario>;
    findAll: () => Promise<GradeHorario[]>;
    findById: (idGradeHorario: string) => Promise<GradeHorario | null>;
    findByTurma: (turma: string) => Promise<GradeHorario[]>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<GradeHorario[]>;
    update: (grade: GradeHorario, funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (grade: GradeHorario, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
}
//# sourceMappingURL=GradeHorarioService.d.ts.map