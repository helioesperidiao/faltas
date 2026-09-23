import { AbonoDAO } from "../dao/AbonoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Abono } from "../models/Abono";
import { Funcionario } from "@/models/Funcionario";
export declare class AbonoService {
    private _abonoDAO;
    private _registroDAO;
    constructor(abonoDAODependency: AbonoDAO, registroDAODependency: RegistroDAO);
    create: (abono: Abono, funcionarioLogado: Funcionario) => Promise<Abono>;
    findAll: () => Promise<Abono[]>;
    findById: (idAbono: string) => Promise<Abono | null>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Abono[]>;
    update: (abono: Abono, funcionarioLogado: Funcionario) => Promise<boolean>;
    aprovar: (idAbono: string, funcionarioLogado: Funcionario) => Promise<Abono>;
    rejeitar: (idAbono: string, funcionarioLogado: Funcionario) => Promise<Abono>;
    delete: (abono: Abono, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
}
//# sourceMappingURL=AbonoService.d.ts.map