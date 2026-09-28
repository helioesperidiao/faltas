import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class CargoDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo>;
    delete(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean>;
    update(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean>;
    findAll(): Promise<Cargo[]>;
    findAllDeleted(): Promise<Cargo[]>;
    findById(idCargo: string): Promise<Cargo | null>;
    findByField(field: string, value: any): Promise<Cargo[]>;
    count(): Promise<number>;
    private toCargo;
}
//# sourceMappingURL=CargoDAO.d.ts.map