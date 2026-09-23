import { RegistroDAO } from "../dao/RegistroDAO";
import { DispensaDAO } from "../dao/DispensaDAO";
import { AlunoDAO } from "../dao/AlunoDAO";
import { Registro } from "../models/Registro";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

export class RegistroService {
    private _registroDAO: RegistroDAO;
    private _dispensaDAO: DispensaDAO;
    private _alunoDAO: AlunoDAO;

    //construtor
    constructor(registroDAODependency: RegistroDAO, dispensaDAODependency: DispensaDAO, alunoDAODependency: AlunoDAO){
        console.log("⬆️  RegistroService.constructor()");
        this._registroDAO = registroDAODependency;
        this._dispensaDAO = dispensaDAODependency;
        this._alunoDAO = alunoDAODependency;
    }

    //create
    public create = async (registro: Registro, funcionarioLogado: Funcionario): Promise<Registro> => {
        console.log("🟣 RegistroService.create()");

        const cargosPermitidos = ["Inspetor", "Administrador", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode registrar chamada.` }
            );
        }

        //dispensa vigente sobrescreve a falta automaticamente (status DISPENSADO)
        const dispensaVigente = await this._dispensaDAO.findVigenteParaAluno(registro.matricula, registro.codDisciplina, registro.dia);
        if (dispensaVigente) {
            registro.falta = false;
            registro.situacao = "Dispensada";
        }

        return await this._registroDAO.create(registro, funcionarioLogado);
    };

    //findAll
    public findAll = async (): Promise<Registro[]> => {
        console.log("🟣 RegistroService.findAll()");
        return await this._registroDAO.findAll();
    };

    //findById
    public findById = async (idRegistro: string): Promise<Registro | null> => {
        console.log("🟣 RegistroService.findById()");
        const registro = new Registro();
        registro.idRegistro = idRegistro;
        return await this._registroDAO.findById(registro.idRegistro);
    };

    //findAllDeleted
    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Registro[]> => {
        console.log("🟣 RegistroService.findAllDeleted()");

        const cargosPermitidos = ["Administrador", "Diretor"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar registros deletados.` }
            );
        }

        return await this._registroDAO.findAllDeleted();
    };
    //modificar talvez os cargos permitidos

    //findAusentesEntrada: lista os alunos da turma marcados como falta=true no dia (para tela de entrada atrasada/acompanhada)
    public findAusentesEntrada = async (turma: string, dia: string): Promise<Registro[]> => {
        console.log("🟣 RegistroService.findAusentesEntrada()");

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const matriculas = alunosDaTurma.map(aluno => aluno.matricula);

        const todosRegistrosDoDia = await this._registroDAO.findAll();
        const dataAlvo = new Date(dia);

        return todosRegistrosDoDia.filter(registro =>
            matriculas.includes(registro.matricula) &&
            registro.falta === true &&
            registro.dia.toDateString() === dataAlvo.toDateString()
        );
    };

    //update
    public update = async (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 RegistroService.update()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir registros.` }
            );
        }

        return await this._registroDAO.update(registro, funcionarioLogado);
    };

    //delete
    public delete = async (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 RegistroService.delete()");

        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir registros.` }
            );
        }

        return await this._registroDAO.delete(registro, funcionarioLogado);
    };

    //count
    public count = async (): Promise<number> => {
        console.log("🟣 RegistroService.count()");
        return await this._registroDAO.count();
    };
}