import { Aluno } from "../models/Aluno";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class AlunoDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(aluno: Aluno, funcionarioLogado: Funcionario): Promise<Aluno>;
    delete(aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean>;
    update(aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean>;
    private toAluno;
    findById(idAluno: string): Promise<Aluno | null>;
    findAll(): Promise<Aluno[]>;
    findAllDeleted(): Promise<Aluno[]>;
    count(): Promise<number>;
    findByField(field: string, value: any): Promise<Aluno[]>;
}
//# sourceMappingURL=AlunoDAO.d.ts.map