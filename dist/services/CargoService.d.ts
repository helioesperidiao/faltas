import { CargoDAO } from "../dao/CargoDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "@/models/Funcionario";
export declare class CargoService {
    private _cargoDAO;
    constructor(cargoDAODependency: CargoDAO);
    create: (cargo: Cargo, funcionarioLogado: Funcionario) => Promise<Cargo>;
    findAll: () => Promise<Cargo[]>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Cargo[]>;
    findById: (idCargo: string) => Promise<Cargo | null>;
    update: (cargo: Cargo, funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (cargo: Cargo, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
}
//# sourceMappingURL=CargoService.d.ts.map