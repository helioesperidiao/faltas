import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "../dao/AlunoDAO";
import { DispensaDAO } from "../dao/DispensaDAO";
export declare class RegistroService {
    private _registroDAO;
    private _alunoDAO;
    private _dispensaDAO;
    constructor(registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO, dispensaDAODependency: DispensaDAO);
    create: (registro: Registro, funcionarioLogado: Funcionario) => Promise<Registro>;
    findAll: () => Promise<Registro[]>;
    findById: (idRegistro: string) => Promise<Registro | null>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Registro[]>;
    update: (registro: Registro, funcionarioLogado: Funcionario) => Promise<boolean>;
    delete: (registro: Registro, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
    findAusentesEntrada: (turma: string, dia: Date) => Promise<Registro[]>;
    findChamadaPorTurmaEDia: (turma: string, dia: Date) => Promise<Registro[]>;
}
//# sourceMappingURL=RegistroService.d.ts.map