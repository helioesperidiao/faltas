import { MongoDatabase } from "@/database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
export interface ConfiguracaoAlertaFalta {
    idConfiguracao: string;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}
export declare class ConfiguracaoAlertaFaltaDAO {
    private readonly database;
    constructor(database: MongoDatabase);
    private collection;
    findAll(): Promise<ConfiguracaoAlertaFalta[]>;
    create(cargaHorariaSemanalMinutos: number, limiteFaltas: number, funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta>;
    update(idConfiguracao: string, cargaHorariaSemanalMinutos: number, limiteFaltas: number, funcionario: Funcionario): Promise<boolean>;
    delete(idConfiguracao: string, funcionario: Funcionario): Promise<boolean>;
    private toConfiguracao;
}
//# sourceMappingURL=ConfiguracaoAlertaFaltaDAO.d.ts.map