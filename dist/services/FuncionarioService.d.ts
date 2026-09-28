import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Funcionario } from "../models/Funcionario";
export declare class FuncionarioService {
    private _funcionarioDAO;
    private _cargoDAO;
    constructor(funcionarioDAODependency: FuncionarioDAO, cargoDAODependency: CargoDAO);
    initializeDefaultAdmin: () => Promise<Funcionario | void>;
    create: (funcionario: Funcionario, funcionarioLogado: Funcionario) => Promise<Funcionario>;
    loginFuncionario: (funcionario: Funcionario) => Promise<{
        user: Funcionario;
        token: string;
    }>;
    findAll: (_funcionarioLogado: Funcionario) => Promise<Funcionario[]>;
    findById: (idFuncionario: string, _funcionarioLogado: Funcionario) => Promise<Funcionario>;
    updateFuncionario: (funcionario: Funcionario, funcionarioLogado: Funcionario) => Promise<boolean>;
    deleteFuncionario: (funcionario: Funcionario, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: (_funcionarioLogado: Funcionario) => Promise<number>;
    countByCargoId: (cargoId: string, _funcionarioLogado: Funcionario) => Promise<number>;
}
//# sourceMappingURL=FuncionarioService.d.ts.map