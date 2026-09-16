import { Registro } from "../models/Registro";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export declare class RegistroDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(registro: Registro, funcionarioLogado: Funcionario): Promise<Registro>;
    delete(registro: Registro, funcionarioLogado: Funcionario): Promise<boolean>;
    update(registro: Registro, funcionarioLogado: Funcionario): Promise<boolean>;
    updateSituacaoPorMatriculaEPeriodo(matricula: string, dataInicio: Date, dataFim: Date, situacao: string, funcionarioLogado: Funcionario): Promise<number>;
    private toRegistro;
    findById(idRegistro: string): Promise<Registro | null>;
    findAll(): Promise<Registro[]>;
    findFaltasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<Registro[]>;
    findAllDeleted(): Promise<Registro[]>;
    count(): Promise<number>;
    findByField(field: string, value: any): Promise<Registro[]>;
    findAusentesEntrada(matriculas: string[], dia: Date): Promise<Registro[]>;
}
//# sourceMappingURL=RegistroDAO.d.ts.map