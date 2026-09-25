import { AbonoDAO } from "../dao/AbonoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Abono } from "../models/Abono";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "@/dao/AlunoDAO";

export class AbonoService {
    private _abonoDAO: AbonoDAO;
    private _registroDAO: RegistroDAO;
    private _alunoDAO: AlunoDAO;

    constructor(abonoDAODependency: AbonoDAO, registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO) {
        console.log("⬆️  AbonoService.constructor()");
        this._abonoDAO = abonoDAODependency;
        this._registroDAO = registroDAODependency;
        this._alunoDAO = alunoDAODependency;
    }

    public create = async (abono: Abono, funcionarioLogado: Funcionario): Promise<Abono> => {
        console.log("🟣 AbonoService.create()");

<<<<<<< HEAD
        const cargosPermitidos = ["Inspetor", "Coordenador", "Secretaria", "Administrador"];
=======
        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar abonos.` }
            );
        }

        abono.status = "Pendente";
        const alunos = await this._alunoDAO.findByField("matricula", abono.matricula);
        if (alunos.length === 0) {
            throw new ErrorResponse(404, "Aluno não encontrado", { matricula: abono.matricula });
        }
        const aluno = alunos[0];
        abono.alunoNome = aluno.alunoNome;
        abono.turma = aluno.turma;
        abono.curso = aluno.curso;
        abono.serie = aluno.serie;
        return await this._abonoDAO.create(abono, funcionarioLogado);
    };

    public findAll = async (): Promise<Abono[]> => {
        console.log("🟣 AbonoService.findAll()");
        return await this._abonoDAO.findAll();
    };

    public findById = async (idAbono: string): Promise<Abono | null> => {
        console.log("🟣 AbonoService.findById()");
        const abono = new Abono();
        abono.idAbono = idAbono;
        return await this._abonoDAO.findById(abono.idAbono);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Abono[]> => {
        console.log("🟣 AbonoService.findAllDeleted()");

        const cargosPermitidos = ["Processo Pedagógico"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar abonos deletados.` }
            );
        }

        return await this._abonoDAO.findAllDeleted();
    };

    public update = async (abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AbonoService.update()");

<<<<<<< HEAD
        const cargosPermitidos = ["Inspetor", "Coordenador", "Secretaria", "Administrador"];
=======
        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir abonos.` }
            );
        }

        const alunos = await this._alunoDAO.findByField("matricula", abono.matricula);
        if (alunos.length === 0) {
            throw new ErrorResponse(404, "Aluno não encontrado", { matricula: abono.matricula });
        }
        const aluno = alunos[0];
        abono.alunoNome = aluno.alunoNome;
        abono.turma = aluno.turma;
        abono.curso = aluno.curso;
        abono.serie = aluno.serie;
        return await this._abonoDAO.update(abono, funcionarioLogado);
    };

    //aprovar: Processo Pedagógico. Ao aprovar, converte as faltas do período em Abonada.
    public aprovar = async (idAbono: string, funcionarioLogado: Funcionario): Promise<Abono> => {
        console.log("🟣 AbonoService.aprovar()");

<<<<<<< HEAD
        const cargosPermitidos = ["Coordenador", "Administrador"];
=======
        const cargosPermitidos = ["Processo Pedagógico"];
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode aprovar abonos.` }
            );
        }

        const abono = await this._abonoDAO.findById(idAbono);
        if (!abono) {
            throw new ErrorResponse(404, "Abono não encontrado");
        }
        if (abono.status !== "Pendente") {
            throw new ErrorResponse(400, "Abono já foi analisado", { status: abono.status });
        }

        abono.status = "Aprovado";
        abono.aprovadoPor = funcionarioLogado.idFuncionario;
        await this._abonoDAO.update(abono, funcionarioLogado);

        await this._registroDAO.updateSituacaoPorMatriculaEPeriodo(
            abono.matricula,
            abono.dataInicio,
            abono.dataFim,
            "Abonada",
            funcionarioLogado
        );

        return abono;
    };

<<<<<<< HEAD
    //Rejeitar abono pendente.
    public rejeitar = async (idAbono: string, funcionarioLogado: Funcionario): Promise<Abono> => {
        console.log("🟣 AbonoService.rejeitar()");

        const cargosPermitidos = ["Coordenador", "Administrador"];
=======
    //rejeitar: Processo Pedagógico
    public rejeitar = async (idAbono: string, funcionarioLogado: Funcionario): Promise<Abono> => {
        console.log("🟣 AbonoService.rejeitar()");

        const cargosPermitidos = ["Processo Pedagógico"];
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode rejeitar abonos.` }
            );
        }

        const abono = await this._abonoDAO.findById(idAbono);
        if (!abono) {
            throw new ErrorResponse(404, "Abono não encontrado");
        }
        if (abono.status !== "Pendente") {
            throw new ErrorResponse(400, "Abono já foi analisado", { status: abono.status });
        }

        abono.status = "Rejeitado";
        abono.aprovadoPor = funcionarioLogado.idFuncionario;
        await this._abonoDAO.update(abono, funcionarioLogado);

        return abono;
    };

    public delete = async (abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 AbonoService.delete()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir abonos.` }
            );
        }

        return await this._abonoDAO.delete(abono, funcionarioLogado);
    };

    public count = async (): Promise<number> => {
        console.log("🟣 AbonoService.count()");
        return await this._abonoDAO.count();
    };
}
