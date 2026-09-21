import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "../dao/AlunoDAO";

const CARGOS_ACESSO_TOTAL = ["Processo Pedagógico"];

export class RegistroService {
    private _registroDAO: RegistroDAO;
    private _alunoDAO: AlunoDAO;

    //construtor
    constructor(registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO){
        console.log("⬆️  RegistroService.constructor()");
        this._registroDAO = registroDAODependency;
        this._alunoDAO = alunoDAODependency;
    }

    //create
    public create = async (registro: Registro, funcionarioLogado: Funcionario): Promise<Registro> => {
        console.log("🟣 RegistroService.create()");
        const aluno = await this._alunoDAO.findByField("matricula", registro.matricula);
        if (aluno.length === 0) {
            throw new ErrorResponse(404, "Aluno não encontrado", { matricula: registro.matricula });
        }

        registro.alunoNome = aluno[0].alunoNome;
        registro.turma = aluno[0].turma;
        registro.curso = aluno[0].curso;
        registro.serie = aluno[0].serie;
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
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!CARGOS_ACESSO_TOTAL.includes(cargoFuncionario)) {
            throw new ErrorResponse(403, "Não autorizado", { message: `Apenas ${CARGOS_ACESSO_TOTAL.join(", ")} podem visualizar registros deletados.` });
        }
        return await this._registroDAO.findAllDeleted();
    };

    //update
    public update = async (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 RegistroService.update()");
        return await this._registroDAO.update(registro, funcionarioLogado);
    };

    //delete
    public delete = async (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 RegistroService.delete()");
        return await this._registroDAO.delete(registro, funcionarioLogado);
    };

    //count
    public count = async (): Promise<number> => {
        console.log("🟣 RegistroService.count()");
        return await this._registroDAO.count();
    };

    //findAusentesEntrada: cruza Aluno (por turma) com Registro (por matricula + dia + falta)
    public findAusentesEntrada = async (turma: string, dia: Date): Promise<Registro[]> => {
        console.log("🟣 RegistroService.findAusentesEntrada()");

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const matriculas = alunosDaTurma.map(aluno => aluno.matricula);

        if (matriculas.length === 0) {
            return [];
        }

        return await this._registroDAO.findAusentesEntrada(matriculas, dia);
    };

    /** Consulta os registros gerais da chamada já concluída para restaurá-la na tela. */
    public findChamadaPorTurmaEDia = async (turma: string, dia: Date): Promise<Registro[]> => {
        return await this._registroDAO.findChamadaPorTurmaEDia(turma, dia);
    };
}
