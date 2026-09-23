import { GradeHorario } from "../models/GradeHorario";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class GradeHorarioDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    private corrigirAcentos;
    create(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<GradeHorario>;
    delete(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean>;
    update(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean>;
    private toGradeHorario;
    findById(idGradeHorario: string): Promise<GradeHorario | null>;
    findAll(): Promise<GradeHorario[]>;
    findAllDeleted(): Promise<GradeHorario[]>;
    count(): Promise<number>;
    findByField(field: string, value: any): Promise<GradeHorario[]>;
}
//# sourceMappingURL=GradeHorarioDAO.d.ts.map