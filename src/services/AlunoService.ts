import { AlunoDAO } from "../dao/AlunoDAO";
import { Aluno } from "../models/Aluno";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { HistoricoTurma } from "@/models/HistoricoTurma";

export class AlunoService {
    private _alunoDAO: AlunoDAO;

    constructor(alunoDAODependency: AlunoDAO) {
        console.log("⬆️  AlunoService.constructor()");
        this._alunoDAO = alunoDAODependency;
    }

    public create = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<Aluno> => {
        console.log("🟣 AlunoService.create()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar alunos.` }
            );
        }

        const jaExiste = await this._alunoDAO.findByField("matricula", aluno.matricula);
        if (jaExiste && jaExiste.length > 0) {
            throw new ErrorResponse(400, "Já existe um aluno com esta matrícula");
        }

        return await this._alunoDAO.create(aluno, funcionarioLogado);
    };

    public findAll = async (): Promise<Aluno[]> => {
        console.log("🟣 AlunoService.findAll()");
        return await this._alunoDAO.findAll();
    };

    public findById = async (idAluno: string): Promise<Aluno | null> => {
        console.log("🟣 AlunoService.findById()");
        const aluno = new Aluno();
        aluno.idAluno = idAluno;
        return await this._alunoDAO.findById(aluno.idAluno);
    };

    public findByMatricula = async (matricula: string): Promise<Aluno | null> => {
        console.log("🟣 AlunoService.findByMatricula()");
        const resultado = await this._alunoDAO.findByField("matricula", matricula);
        return resultado.length > 0 ? resultado[0] : null;
    };

    public findByTurma = async (turma: string): Promise<Aluno[]> => {
        console.log("🟣 AlunoService.findByTurma()");
        return await this._alunoDAO.findByField("turma", turma);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Aluno[]> => {
        console.log("🟣 AlunoService.findAllDeleted()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar alunos deletados.` }
            );
        }

        return await this._alunoDAO.findAllDeleted();
    };

    public update = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AlunoService.update()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar alunos.` }
            );
        }

        const alunoAnterior = await this._alunoDAO.findById(aluno.idAluno);
        if (!alunoAnterior) {
            return false;
        }

        aluno.historicoTurmas = alunoAnterior.historicoTurmas;
        aluno.turmaInicioEm = alunoAnterior.turmaInicioEm;

        if (this.alterouEnturmacao(alunoAnterior, aluno)) {
            aluno.historicoTurmas = [
                ...alunoAnterior.historicoTurmas,
                this.criarHistorico(alunoAnterior)
            ];
            aluno.turmaInicioEm = new Date();
        }

        return await this._alunoDAO.update(aluno, funcionarioLogado);
    };

    /** Atualiza uma turma inteira na virada do ano sem recriar cadastros. */
    public promoverTurma = async (
        turmaOrigem: string,
        turmaDestino: string,
        anoDestino: string,
        serieDestino: string,
        funcionarioLogado: Funcionario
    ): Promise<number> => {
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode executar a virada anual de turma."
            });
        }

        const alunos = await this._alunoDAO.findByField("turma", turmaOrigem);
        for (const aluno of alunos) {
            aluno.historicoTurmas = [...aluno.historicoTurmas, this.criarHistorico(aluno)];
            aluno.turma = turmaDestino;
            aluno.ano = anoDestino;
            if (serieDestino) {
                aluno.serie = serieDestino;
            }
            aluno.turmaInicioEm = new Date();
        }

        return await this._alunoDAO.atualizarEnturmacaoEmLote(alunos, funcionarioLogado);
    };

    private alterouEnturmacao(anterior: Aluno, atualizado: Aluno): boolean {
        return anterior.turma !== atualizado.turma ||
            anterior.curso !== atualizado.curso ||
            anterior.serie !== atualizado.serie ||
            anterior.ano !== atualizado.ano;
    }

    private criarHistorico(aluno: Aluno): HistoricoTurma {
        const fimEm = new Date();
        const disponivelAte = new Date(fimEm);
        disponivelAte.setFullYear(disponivelAte.getFullYear() + 1);

        return {
            turma: aluno.turma,
            curso: aluno.curso,
            serie: aluno.serie,
            ano: aluno.ano,
            inicioEm: aluno.turmaInicioEm,
            fimEm,
            disponivelAte
        };
    }

    public delete = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AlunoService.delete()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir alunos.` }
            );
        }

        return await this._alunoDAO.delete(aluno, funcionarioLogado);
    };

    public count = async (): Promise<number> => {
        console.log("🟣 AlunoService.count()");
        return await this._alunoDAO.count();
    };
}
