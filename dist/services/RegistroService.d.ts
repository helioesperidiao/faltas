import { RegistroDAO } from "../dao/RegistroDAO";
import { DispensaDAO } from "../dao/DispensaDAO";
import { AlunoDAO } from "../dao/AlunoDAO";
import { Registro } from "../models/Registro";
import { Funcionario } from "@/models/Funcionario";
export declare class RegistroService {
    private _registroDAO;
    private _dispensaDAO;
    private _alunoDAO;
    constructor(registroDAODependency: RegistroDAO, dispensaDAODependency: DispensaDAO, alunoDAODependency: AlunoDAO);
    create: (registro: Registro, funcionarioLogado: Funcionario) => Promise<Registro>;
    findAll: () => Promise<Registro[]>;
    findById: (idRegistro: string) => Promise<Registro | null>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Registro[]>;
    findAusentesEntrada: (turma: string, dia: string) => Promise<Registro[]>;
    update: (registro: Registro, funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (registro: Registro, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
}
//# sourceMappingURL=RegistroService.d.ts.map