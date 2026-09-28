import { Abono } from "../models/Abono";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class AbonoDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(abono: Abono, funcionarioLogado: Funcionario): Promise<Abono>;
    delete(abono: Abono, funcionarioLogado: Funcionario): Promise<boolean>;
    update(abono: Abono, funcionarioLogado: Funcionario): Promise<boolean>;
    private toAbono;
    findById(idAbono: string): Promise<Abono | null>;
    findAll(): Promise<Abono[]>;
    findAllDeleted(): Promise<Abono[]>;
    count(): Promise<number>;
    findByField(field: string, value: any): Promise<Abono[]>;
}
//# sourceMappingURL=AbonoDAO.d.ts.map