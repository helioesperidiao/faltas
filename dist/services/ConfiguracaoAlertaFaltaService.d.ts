import { ConfiguracaoAlertaFalta, ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { Funcionario } from "@/models/Funcionario";
export declare class ConfiguracaoAlertaFaltaService {
    private readonly dao;
    constructor(dao: ConfiguracaoAlertaFaltaDAO);
    private validarAcesso;
    private validarValores;
    findAll(funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta[]>;
    create(carga: number, limite: number, funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta>;
    update(id: string, carga: number, limite: number, funcionario: Funcionario): Promise<boolean>;
    delete(id: string, funcionario: Funcionario): Promise<boolean>;
}
//# sourceMappingURL=ConfiguracaoAlertaFaltaService.d.ts.map