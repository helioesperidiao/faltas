import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "../dao/AlunoDAO";
export declare class RegistroService {
    private _registroDAO;
    private _alunoDAO;
    constructor(registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO);
    create: (registro: Registro, funcionarioLogado: Funcionario) => Promise<Registro>;
    findAll: () => Promise<Registro[]>;
    findById: (idRegistro: string) => Promise<Registro | null>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Registro[]>;
    update: (registro: Registro, funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (registro: Registro, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
    findAusentesEntrada: (turma: string, dia: Date) => Promise<Registro[]>;
}
//# sourceMappingURL=RegistroService.d.ts.map