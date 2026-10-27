import { AbonoDAO } from "../dao/AbonoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Abono } from "../models/Abono";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "@/dao/AlunoDAO";
export declare class AbonoService {
    private _abonoDAO;
    private _registroDAO;
    private _alunoDAO;
    constructor(abonoDAODependency: AbonoDAO, registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO);
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