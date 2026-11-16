import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { ErrorResponse } from "../http/ErrorResponse";
import { CARGO_PROCESSO_PEDAGOGICO } from "../constants/Cargos";
import { Funcionario } from "../models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoService");

/**
 * Regras de negócio de Cargo.
 *
 * Requer o FuncionarioDAO apenas para validar exclusão (não permite excluir
 * um cargo que ainda tenha funcionários vinculados).
 */
export class CargoService {
    private _cargoDAO: CargoDAO;
    private _funcionarioDAO: FuncionarioDAO;

    /**
     * Recebe os DAOs de Cargo e Funcionario por injeção.
     *
     * @param cargoDAODependency - DAO de Cargo.
     * @param funcionarioDAODependency - DAO de Funcionario (usado no delete para
     *   verificar se há funcionários vinculados ao cargo).
     */
    constructor(cargoDAODependency: CargoDAO, funcionarioDAODependency: FuncionarioDAO) {
        this._cargoDAO = cargoDAODependency;
        this._funcionarioDAO = funcionarioDAODependency;
    }

    /**
     * Verifica se o funcionário logado tem permissão administrativa.
     *
     * O cargo "Administrador" deixou de existir (ver docs/cargos-aceitos.md);
     * suas operações administrativas passaram para "Processo Pedagógico".
     */
    private isAdmin(funcionario: Funcionario): boolean {
        return funcionario.cargo?.nomeCargo === CARGO_PROCESSO_PEDAGOGICO;
    }

    /**
     * Cria um cargo, se o funcionário logado for administrador e o nome não existir.
     *
     * @param cargo - Cargo a ser criado.
     * @param funcionarioLogado - Funcionário autenticado (auditoria + permissão).
     * @throws {ErrorResponse} 403 se o autor não for admin.
     * @throws {ErrorResponse} 400 se o nome do cargo já existir.
     */
    public create = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> => {
        log.debug("create()", { nomeCargo: cargo.nomeCargo });

        if (!this.isAdmin(funcionarioLogado)) {
            log.warn("criação de cargo negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a criar cargos.`
            });
        }

        // Evita duplicidade antes de tentar gravar (feedback mais claro ao usuário).
        // O índice único do Mongo (CargoDAO.ensureIndexes) também protege o caso
        // de corrida: se dois requests passarem por aqui juntos, o segundo recebe
        // erro 11000 e é traduzido abaixo.
        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        if (resultado.length > 0) {
            throw new ErrorResponse(400, "Cargo já existe", {
                message: `O cargo "${cargo.nomeCargo}" já existe.`
            });
        }

        try {
            // ✅ AGORA passa funcionarioLogado — o DAO precisa dele para auditoria.
            const criado = await this._cargoDAO.create(cargo, funcionarioLogado);
            log.info("cargo criado", {
                idCargo: criado.idCargo,
                nomeCargo: criado.nomeCargo,
                criadoPor: funcionarioLogado.email,
            });
            return criado;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ErrorResponse(400, "Cargo já existe", {
                    message: `O cargo "${cargo.nomeCargo}" já existe.`
                });
            }
            log.error("falha ao criar cargo", { nomeCargo: cargo.nomeCargo, error: err });
            throw err;
        }
    };

    /**
     * Lista todos os cargos ativos.
     * O parâmetro existe só por simetria com as outras operações (não é usado).
     */
    public findAll = async (_funcionarioLogado: Funcionario): Promise<Cargo[]> => {
        log.debug("findAll()");
        return await this._cargoDAO.findAll();
    };

    /**
     * Lista todos os cargos que sofreram soft delete.
     *
     * Necessário para o endpoint GET /api/v1/cargos/deleted usado em
     * Cargos.html (checkbox "Mostrar cargos inativos").
     */
    public findAllDeleted = async (_funcionarioLogado: Funcionario): Promise<Cargo[]> => {
        log.debug("findAllDeleted()");
        return await this._cargoDAO.findAllDeleted();
    };

    /**
     * Busca um cargo pelo ID; devolve null quando não encontrado.
     */
    public findById = async (idCargo: string, _funcionarioLogado: Funcionario): Promise<Cargo | null> => {
        log.debug("findById()", { idCargo });
        const cargo = new Cargo();
        cargo.idCargo = idCargo;
        return await this._cargoDAO.findById(cargo.idCargo);
    };

    /**
     * Atualiza o nome de um cargo, se o autor for admin e o nome não colidir
     * com outro cargo já existente.
     *
     * @param cargo - Cargo com os dados atualizados (idCargo obrigatório).
     * @param funcionarioLogado - Funcionário autenticado (auditoria + permissão).
     * @throws {ErrorResponse} 403 se o autor não for admin.
     * @throws {ErrorResponse} 400 se o nome já pertencer a outro cargo.
     */
    public update = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idCargo: cargo.idCargo });

        if (!this.isAdmin(funcionarioLogado)) {
            log.warn("atualização de cargo negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a atualizar cargos.`
            });
        }

        const duplicados = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        const duplicadoDeOutro = duplicados.some(c => c.idCargo !== cargo.idCargo);
        if (duplicadoDeOutro) {
            throw new ErrorResponse(400, "Cargo já existe", {
                message: `O cargo "${cargo.nomeCargo}" já existe.`
            });
        }

        try {
            // ✅ AGORA passa funcionarioLogado — o DAO precisa dele para auditoria.
            const atualizou = await this._cargoDAO.update(cargo, funcionarioLogado);
            if (atualizou) {
                log.info("cargo atualizado", {
                    idCargo: cargo.idCargo,
                    nomeCargo: cargo.nomeCargo,
                    atualizadoPor: funcionarioLogado.email,
                });
            }
            return atualizou;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ErrorResponse(400, "Cargo já existe", {
                    message: `O cargo "${cargo.nomeCargo}" já existe.`
                });
            }
            throw err;
        }
    };

    /**
     * Exclui um cargo, se o autor for admin e não houver funcionários vinculados.
     *
     * @param cargo - Cargo a ser excluído (idCargo obrigatório).
     * @param funcionarioLogado - Funcionário autenticado (auditoria + permissão).
     * @throws {ErrorResponse} 403 se o autor não for admin.
     * @throws {ErrorResponse} 400 se houver funcionários vinculados ao cargo.
     */
    public delete = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idCargo: cargo.idCargo });

        if (!this.isAdmin(funcionarioLogado)) {
            log.warn("exclusão de cargo negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a excluir cargos.`
            });
        }

        // Regra de integridade: não permite excluir um cargo "em uso".
        const total = await this._funcionarioDAO.countByCargoId(cargo.idCargo);
        if (total > 0) {
            log.warn("exclusão de cargo bloqueada", {
                idCargo: cargo.idCargo,
                funcionariosVinculados: total,
            });
            throw new ErrorResponse(400, "Não é possível excluir o cargo", {
                message: `Existem ${total} funcionário(s) vinculados a este cargo. Reatribua-os antes de excluir.`
            });
        }

        // ✅ AGORA passa funcionarioLogado — o DAO precisa dele para auditoria.
        const excluiu = await this._cargoDAO.delete(cargo, funcionarioLogado);
        if (excluiu) {
            log.info("cargo excluído", {
                idCargo: cargo.idCargo,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    /**
     * Conta os cargos ativos (público).
     */
    public count = async (_funcionarioLogado: Funcionario): Promise<number> => {
        log.debug("count()");
        return await this._cargoDAO.count();
    };
}