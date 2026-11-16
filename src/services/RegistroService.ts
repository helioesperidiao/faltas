import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "../dao/AlunoDAO";
import { DispensaDAO } from "../dao/DispensaDAO";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("RegistroService");

const CARGOS_ACESSO_TOTAL = ["Processo Pedagógico"];

export class RegistroService {
    private _registroDAO: RegistroDAO;
    private _alunoDAO: AlunoDAO;
    private _dispensaDAO: DispensaDAO;

    //construtor
    constructor(registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO, dispensaDAODependency: DispensaDAO){
        this._registroDAO = registroDAODependency;
        this._alunoDAO = alunoDAODependency;
        this._dispensaDAO = dispensaDAODependency;
    }

    //create
    public create = async (registro: Registro, funcionarioLogado: Funcionario): Promise<Registro> => {
        log.debug("create()", { matricula: registro.matricula, codDisciplina: registro.codDisciplina });

        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("registro de chamada negado", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode registrar chamada.` }
            );
        }

        // A chamada geral é uma por aluno e dia: um reenvio corrige o registro existente.
        if (registro.codDisciplina === "GERAL") {
            const existente = await this._registroDAO.findGeralDoAlunoNoDia(registro.matricula, registro.dia);
            if (existente) {
                existente.falta = registro.falta;
                existente.atrasado = registro.atrasado;
                existente.nomeAcompanhante = registro.nomeAcompanhante;
                await this._registroDAO.update(existente, funcionarioLogado);
                log.info("chamada geral já existia; registro corrigido", {
                    idRegistro: existente.idRegistro,
                    matricula: existente.matricula,
                });
                return existente;
            }
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
            log.debug("falta convertida em dispensa", {
                matricula: registro.matricula,
                idDispensa: dispensaVigente.idDispensa,
            });
        }

        registro.alunoNome = aluno.alunoNome;
        registro.turma = aluno.turma;
        registro.curso = aluno.curso;
        registro.serie = aluno.serie;

        const criado = await this._registroDAO.create(registro, funcionarioLogado);
        log.info("registro criado", {
            idRegistro: criado.idRegistro,
            matricula: criado.matricula,
            situacao: criado.situacao,
            registradoPor: funcionarioLogado.email,
        });
        return criado;
    };

    //findAll
    public findAll = async (): Promise<Registro[]> => {
        log.debug("findAll()");
        return await this._registroDAO.findAll();
    };

    //findById
    public findById = async (idRegistro: string): Promise<Registro | null> => {
        log.debug("findById()", { idRegistro });
        const registro = new Registro();
        registro.idRegistro = idRegistro;
        return await this._registroDAO.findById(registro.idRegistro);
    };

    //findAllDeleted
    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Registro[]> => {
        log.debug("findAllDeleted()");
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!CARGOS_ACESSO_TOTAL.includes(cargoFuncionario)) {
            log.warn("busca de registros deletados negada", {
                motivo: "cargo não autorizado",
                cargoAtor: cargoFuncionario,
            });
            throw new ErrorResponse(403, "Não autorizado", { message: `Apenas ${CARGOS_ACESSO_TOTAL.join(", ")} podem visualizar registros deletados.` });
        }
        return await this._registroDAO.findAllDeleted();
    };

    //update
    public update = async (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idRegistro: registro.idRegistro });
        const atualizou = await this._registroDAO.update(registro, funcionarioLogado);
        if (atualizou) {
            log.info("registro atualizado", {
                idRegistro: registro.idRegistro,
                atualizadoPor: funcionarioLogado.email,
            });
        }
        return atualizou;
    };

    //delete
    public delete = async (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idRegistro: registro.idRegistro });
        const excluiu = await this._registroDAO.delete(registro, funcionarioLogado);
        if (excluiu) {
            log.info("registro excluído", {
                idRegistro: registro.idRegistro,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    //count
    public count = async (): Promise<number> => {
        log.debug("count()");
        return await this._registroDAO.count();
    };

    //findAusentesEntrada: cruza Aluno (por turma) com Registro (por matricula + dia + falta)
    public findAusentesEntrada = async (turma: string, dia: Date): Promise<Registro[]> => {
        log.debug("findAusentesEntrada()", { turma, dia });

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const matriculas = alunosDaTurma.map(aluno => aluno.matricula);

        if (matriculas.length === 0) {
            log.debug("turma sem alunos; retornando lista vazia", { turma });
            return [];
        }

        const ausentes = await this._registroDAO.findAusentesEntrada(matriculas, dia);
        log.debug("ausentes encontrados", { turma, dia, total: ausentes.length });
        return ausentes;
    };

    /** Consulta os registros gerais da chamada já concluída para restaurá-la na tela. */
    public findChamadaPorTurmaEDia = async (turma: string, dia: Date): Promise<Registro[]> => {
        log.debug("findChamadaPorTurmaEDia()", { turma, dia });
        const registros = await this._registroDAO.findChamadaPorTurmaEDia(turma, dia);
        log.debug("chamada consultada", { turma, dia, total: registros.length });
        return registros;
    };
}