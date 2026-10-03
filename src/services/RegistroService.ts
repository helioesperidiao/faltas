import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "../dao/AlunoDAO";
import { DispensaDAO } from "../dao/DispensaDAO";

const CARGOS_ACESSO_TOTAL = ["Processo Pedagógico"];

export class RegistroService {
    private _registroDAO: RegistroDAO;
    private _alunoDAO: AlunoDAO;
    private _dispensaDAO: DispensaDAO;

    //construtor
    constructor(registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO, dispensaDAODependency: DispensaDAO){
        console.log("⬆️  RegistroService.constructor()");
        this._registroDAO = registroDAODependency;
        this._alunoDAO = alunoDAODependency;
        this._dispensaDAO = dispensaDAODependency;
    }

    //create
    public create = async (registro: Registro, funcionarioLogado: Funcionario): Promise<Registro> => {
        console.log("🟣 RegistroService.create()");
        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode registrar chamada.` }
            );
        }

        const alunos = await this._alunoDAO.findByField("matricula", registro.matricula);
        if (alunos.length === 0) {
            throw new ErrorResponse(404, "Aluno não encontrado", { matricula: registro.matricula });
        }
        const aluno = alunos[0];
        const dispensaVigente = await this._dispensaDAO.findVigenteParaAluno(aluno.idAluno, registro.codDisciplina, registro.dia);
        if (dispensaVigente) {
            registro.falta = false;
            registro.situacao = "Dispensada";
        }

        registro.alunoNome = aluno.alunoNome;
        registro.turma = aluno.turma;
        registro.curso = aluno.curso;
        registro.serie = aluno.serie;
        return await this._registroDAO.create(registro, funcionarioLogado);
    };

    /**
     * Inclui ausências gerais digitadas em Entradas e Saídas. Se a chamada da
     * turma já existir, reaproveita o registro do aluno em vez de duplicá-lo.
     */
    public criarFaltasGeraisEmLote = async (
        faltas: Array<{ matricula: string; data: string }>,
        funcionarioLogado: Funcionario
    ): Promise<Registro[]> => {
        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode registrar faltas.`
            });
        }

        const chaves = new Set<string>();
        const registros: Registro[] = [];
        for (const falta of faltas) {
            const matricula = falta.matricula.trim();
            const data = this.lerDataDaLista(falta.data);
            if (!matricula) {
                throw new ErrorResponse(400, "Matrícula é obrigatória.");
            }
            const chave = `${matricula}\u0000${falta.data}`;
            if (chaves.has(chave)) {
                throw new ErrorResponse(400, "A lista contém o mesmo aluno mais de uma vez para a mesma data.");
            }
            chaves.add(chave);

            const existente = await this._registroDAO.findChamadaGeralPorMatriculaEDia(matricula, data);
            if (existente) {
                if (existente.situacao !== "Dispensada") {
                    existente.falta = true;
                    existente.atrasado = "Não";
                    await this._registroDAO.update(existente, funcionarioLogado);
                }
                registros.push(existente);
                continue;
            }

            const registro = new Registro();
            registro.ano = data.getFullYear();
            registro.codDisciplina = "GERAL";
            registro.horaInicio = 0;
            registro.horaFim = 0;
            registro.matricula = matricula;
            registro.falta = true;
            registro.dia = data;
            registro.atrasado = "Não";
            registros.push(await this.create(registro, funcionarioLogado));
        }
        return registros;
    };

    private lerDataDaLista(valor: string): Date {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            throw new ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        const [ano, mes, dia] = valor.split("-").map(Number);
        const data = new Date(ano, mes - 1, dia);
        if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
            throw new ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        return data;
    }

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
