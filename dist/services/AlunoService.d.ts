import { AlunoDAO } from "../dao/AlunoDAO";
import { Aluno } from "../models/Aluno";
import { Funcionario } from "@/models/Funcionario";
export declare class AlunoService {
    private _alunoDAO;
    constructor(alunoDAODependency: AlunoDAO);
    create: (aluno: Aluno, funcionarioLogado: Funcionario) => Promise<Aluno>;
    findAll: () => Promise<Aluno[]>;
    findById: (idAluno: string) => Promise<Aluno | null>;
    findByMatricula: (matricula: string) => Promise<Aluno | null>;
    findByTurma: (turma: string) => Promise<Aluno[]>;
    findAllDeleted: (funcionarioLogado: Funcionario) => Promise<Aluno[]>;
    update: (aluno: Aluno, funcionarioLogado: Funcionario) => Promise<boolean>;
    promoverTurma: (turmaOrigem: string, turmaDestino: string, anoDestino: string, serieDestino: string, funcionarioLogado: Funcionario) => Promise<number>;
    private alterouEnturmacao;
    private criarHistorico;
    delete: (aluno: Aluno, funcionarioLogado: Funcionario) => Promise<boolean>;
    count: () => Promise<number>;
}
//# sourceMappingURL=AlunoService.d.ts.map