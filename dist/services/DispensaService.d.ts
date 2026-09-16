import { DispensaDAO } from "../dao/DispensaDAO";
import { Dispensa } from "../models/Dispensa";
import { Funcionario } from "@/models/Funcionario";
export declare class DispensaService {
    private _dispensaDAO;
    constructor(dispensaDAODependency: DispensaDAO);
    create: (dispensa: Dispensa, funcionarioLogado: Funcionario) => Promise<Dispensa>;
    findAll: () => Promise<Dispensa[]>;
    findById: (idDispensa: string) => Promise<Dispensa | null>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Dispensa[]>;
    update: (dispensa: Dispensa, funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (dispensa: Dispensa, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
}
//# sourceMappingURL=DispensaService.d.ts.map