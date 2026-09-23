import { Movimentacao } from "../models/Movimentacao";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "../models/Funcionario";
export declare class MovimentacaoDAO {
    private readonly database;
    constructor(database: MongoDatabase);
    private getCollection;
    create(movimentacao: Movimentacao, funcionario: Funcionario): Promise<Movimentacao>;
    findAll(): Promise<Movimentacao[]>;
    private toMovimentacao;
}
//# sourceMappingURL=MovimentacaoDAO.d.ts.map