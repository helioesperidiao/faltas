import { Dispensa } from "../models/Dispensa";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class DispensaDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<Dispensa>;
    delete(dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean>;
    update(dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean>;
    private toDispensa;
    findById(idDispensa: string): Promise<Dispensa | null>;
    findAll(): Promise<Dispensa[]>;
    findAllDeleted(): Promise<Dispensa[]>;
    count(): Promise<number>;
    findByField(field: string, value: any): Promise<Dispensa[]>;
    findVigenteParaAluno(idAluno: string, cod: string, data: Date): Promise<Dispensa | null>;
}
//# sourceMappingURL=DispensaDAO.d.ts.map