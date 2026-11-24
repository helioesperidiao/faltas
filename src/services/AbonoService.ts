import { AbonoDAO } from "../dao/AbonoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Abono } from "../models/Abono";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { AlunoDAO } from "@/dao/AlunoDAO";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("AbonoService");

export class AbonoService {
    private _abonoDAO: AbonoDAO;
    private _registroDAO: RegistroDAO;
    private _alunoDAO: AlunoDAO;

    constructor(abonoDAODependency: AbonoDAO, registroDAODependency: RegistroDAO, alunoDAODependency: AlunoDAO) {
        this._abonoDAO = abonoDAODependency;
        this._registroDAO = registroDAODependency;
        this._alunoDAO = alunoDAODependency;
    }

    public create = async (abono: Abono, funcionarioLogado: Funcionario): Promise<Abono> => {
        log.debug("create()", { matricula: abono.matricula });

        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("criação de abono negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar abonos.` }
            );
        }

        if (abono.dataInicio > abono.dataFim) throw new ErrorResponse(400, "Período de abono inválido.");
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

        const criado = await this._abonoDAO.create(abono, funcionarioLogado);
        log.info("abono criado", {
            idAbono: criado.idAbono,
            matricula: criado.matricula,
            criadoPor: funcionarioLogado.email,
        });
        return criado;
    };

    public findAll = async (): Promise<Abono[]> => {
        log.debug("findAll()");
        const abonos = await this._abonoDAO.findAll();
        if (abonos.some(abono => !abono.alunoNome)) {
            const [ativos, arquivados] = await Promise.all([this._alunoDAO.findAll(), this._alunoDAO.findAllDeleted()]);
            const nomes = new Map([...arquivados, ...ativos].map(aluno => [aluno.matricula, aluno.alunoNome]));
            abonos.forEach(abono => { if (!abono.alunoNome) abono.alunoNome = nomes.get(abono.matricula) || ""; });
        }
        return abonos;
    };

    public findById = async (idAbono: string): Promise<Abono | null> => {
        log.debug("findById()", { idAbono });
        const abono = new Abono();
        abono.idAbono = idAbono;
        return await this._abonoDAO.findById(abono.idAbono);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Abono[]> => {
        log.debug("findAllDeleted()");

        const cargosPermitidos = ["Processo Pedagógico"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!cargosPermitidos.includes(cargoFuncionario)) {
            log.warn("busca de abonos deletados negada", {
                motivo: "cargo não autorizado",
                cargoAtor: cargoFuncionario,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar abonos deletados.` }
            );
        }

        return await this._abonoDAO.findAllDeleted();
    };

    public update = async (abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idAbono: abono.idAbono });

        const cargosPermitidos = ["Inspetor", "Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("atualização de abono negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir abonos.` }
            );
        }

        if (abono.dataInicio > abono.dataFim) throw new ErrorResponse(400, "Período de abono inválido.");
        const alunos = await this._alunoDAO.findByField("matricula", abono.matricula);
        if (alunos.length === 0) {
            throw new ErrorResponse(404, "Aluno não encontrado", { matricula: abono.matricula });
        }
        const aluno = alunos[0];
        abono.alunoNome = aluno.alunoNome;
        abono.turma = aluno.turma;
        abono.curso = aluno.curso;
        abono.serie = aluno.serie;

        const atualizou = await this._abonoDAO.update(abono, funcionarioLogado);
        if (atualizou) {
            log.info("abono atualizado", {
                idAbono: abono.idAbono,
                atualizadoPor: funcionarioLogado.email,
            });
        }
        return atualizou;
    };

    //aprovar: Processo Pedagógico. Ao aprovar, converte as faltas do período em Abonada.
    public aprovar = async (idAbono: string, funcionarioLogado: Funcionario): Promise<Abono> => {
        log.debug("aprovar()", { idAbono });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("aprovação de abono negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
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

        const total = await this._registroDAO.updateSituacaoPorMatriculaEPeriodo(
            abono.matricula,
            abono.dataInicio,
            abono.dataFim,
            "Abonada",
            funcionarioLogado
        );

        log.info("abono aprovado", {
            idAbono: abono.idAbono,
            matricula: abono.matricula,
            faltasConvertidas: total,
            aprovadoPor: funcionarioLogado.email,
        });
        return abono;
    };

    //rejeitar: Processo Pedagógico
    public rejeitar = async (idAbono: string, funcionarioLogado: Funcionario): Promise<Abono> => {
        log.debug("rejeitar()", { idAbono });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("rejeição de abono negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
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

        log.info("abono rejeitado", {
            idAbono: abono.idAbono,
            rejeitadoPor: funcionarioLogado.email,
        });
        return abono;
    };

    public delete = async (abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idAbono: abono.idAbono });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("exclusão de abono negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir abonos.` }
            );
        }

        const excluiu = await this._abonoDAO.delete(abono, funcionarioLogado);
        if (excluiu) {
            log.info("abono excluído", {
                idAbono: abono.idAbono,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    public count = async (): Promise<number> => {
        log.debug("count()");
        return await this._abonoDAO.count();
    };
}