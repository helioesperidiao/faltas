import { AlunoDAO } from "../dao/AlunoDAO";
import { Aluno } from "../models/Aluno";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

export class AlunoService {
    private _alunoDAO: AlunoDAO;

    constructor(alunoDAODependency: AlunoDAO) {
        console.log("⬆️  AlunoService.constructor()");
        this._alunoDAO = alunoDAODependency;
    }

    public create = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<Aluno> => {
        console.log("🟣 AlunoService.create()");

        const cargosPermitidos = ["Secretaria", "Administrador"];
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

        const cargosPermitidos = ["Administrador", "Diretor"];
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

        const cargosPermitidos = ["Secretaria", "Administrador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar alunos.` }
            );
        }

        return await this._alunoDAO.update(aluno, funcionarioLogado);
    };

    public delete = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AlunoService.delete()");

        const cargosPermitidos = ["Secretaria", "Administrador"];
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
