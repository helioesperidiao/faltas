import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class FuncionarioDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(objFuncionarioModel: Funcionario, funcionarioLogado: Funcionario): Promise<Funcionario>;
    delete(objFuncionarioModel: Funcionario, funcionarioLogado: Funcionario): Promise<boolean>;
    update(objFuncionarioModel: Funcionario, funcionarioLogado: Funcionario): Promise<boolean>;
    findAll(): Promise<Funcionario[]>;
    findById(idFuncionario: string): Promise<Funcionario | null>;
    findByField(field: string, value: any): Promise<Funcionario[]>;
    findByEmail(email: string): Promise<Funcionario | null>;
    count(): Promise<number>;
    countByCargoId(cargoId: string): Promise<number>;
    private toFuncionario;
}
//# sourceMappingURL=FuncionarioDAO.d.ts.map