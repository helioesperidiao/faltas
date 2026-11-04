import { DispensaDAO } from "../dao/DispensaDAO";
import { Dispensa } from "../models/Dispensa";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("DispensaService");

const CARGOS_ACESSO_TOTAL = ["Processo Pedagógico"];

export class DispensaService {
    private _dispensaDAO: DispensaDAO;

    //construtor
    constructor(dispensaDAODependency: DispensaDAO){
        this._dispensaDAO = dispensaDAODependency;
    }

    //create
    public create = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<Dispensa> => {
        log.debug("create()", { idAluno: dispensa.idAluno, turma: dispensa.turma });
        const criada = await this._dispensaDAO.create(dispensa, funcionarioLogado);
        log.info("dispensa criada", {
            idDispensa: criada.idDispensa,
            idAluno: criada.idAluno,
            criadaPor: funcionarioLogado.email,
        });
        return criada;
    };

    //findAll
    public findAll = async (): Promise<Dispensa[]> => {
        log.debug("findAll()");
        return await this._dispensaDAO.findAll();
    };

    //findById
    public findById = async (idDispensa: string): Promise<Dispensa | null> => {
        log.debug("findById()", { idDispensa });
        const dispensa = new Dispensa();
        dispensa.idDispensa = idDispensa;
        return await this._dispensaDAO.findById(dispensa.idDispensa);
    };

    //findAllDeleted
    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Dispensa[]> => {
        log.debug("findAllDeleted()");

        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!CARGOS_ACESSO_TOTAL.includes(cargoFuncionario)) {
            log.warn("busca de dispensas deletadas negada", {
                motivo: "cargo não autorizado",
                cargoAtor: cargoFuncionario,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${CARGOS_ACESSO_TOTAL.join(", ")} podem visualizar dispensas deletadas.` }
            );
        }

        return await this._dispensaDAO.findAllDeleted();
    };

    //update
    public update = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idDispensa: dispensa.idDispensa });
        const atualizou = await this._dispensaDAO.update(dispensa, funcionarioLogado);
        if (atualizou) {
            log.info("dispensa atualizada", {
                idDispensa: dispensa.idDispensa,
                atualizadaPor: funcionarioLogado.email,
            });
        }
        return atualizou;
    };

    //delete
    public delete = async (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idDispensa: dispensa.idDispensa });
        const excluiu = await this._dispensaDAO.delete(dispensa, funcionarioLogado);
        if (excluiu) {
            log.info("dispensa excluída", {
                idDispensa: dispensa.idDispensa,
                excluidaPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    //count
    public count = async (): Promise<number> => {
        log.debug("count()");
        return await this._dispensaDAO.count();
    };
}