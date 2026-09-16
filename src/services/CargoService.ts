import { CargoDAO } from "../dao/CargoDAO";
import { Cargo } from "../models/Cargo";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { cargoAceito, CARGO_PROCESSO_PEDAGOGICO, nomeCargoCanonico } from "@/constants/Cargos";

/**
 * Classe responsável pela camada de serviço para a entidade Cargo.
 * 
 * Observações sobre injeção de dependência:
 * - O CargoService **recebe uma instância de CargoDAO via construtor**.
 * - Isso segue o padrão de injeção de dependência, tornando o serviço desacoplado
 *   do DAO concreto, facilitando testes unitários e substituição por mocks.
 */
export class CargoService {
    private _cargoDAO: CargoDAO;

    /**
     * Construtor da classe CargoService.
     * @param cargoDAODependency - Instância de CargoDAO injetada.
     */
    constructor(cargoDAODependency: CargoDAO) {
        console.log("⬆️  CargoService.constructor()");
        this._cargoDAO = cargoDAODependency;
    }

    /**
     * Cria um novo cargo.
     * 
     * 🔹 Regra de negócio: apenas Processo Pedagógico pode criar os cargos aceitos.
     * 🔹 Regra de negócio: não pode existir outro cargo com o mesmo nome.
     * 
     * @param cargo - Objeto Cargo a ser criado.
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns O cargo criado com o ID preenchido.
     * @throws {ErrorResponse} Se o usuário não for Processo Pedagógico ou se o cargo já existir.
     */
    public create = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> => {
        console.log("🟣 CargoService.createCargo()");

        if (funcionarioLogado.cargo.nomeCargo !== CARGO_PROCESSO_PEDAGOGICO) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não é autorizado a criar cargos.` }
            );
        }

        const nomeCanonico = nomeCargoCanonico(cargo.nomeCargo);
        if (!nomeCanonico || !cargoAceito(cargo.nomeCargo)) {
            throw new ErrorResponse(400, "Cargo inválido", {
                message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
            });
        }
        cargo.nomeCargo = nomeCanonico;

        // Verifica se já existe um cargo com o mesmo nome
        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        if (resultado.length > 0) {
            throw new ErrorResponse(
                400,
                "Cargo já existe",
                { message: `O cargo "${cargo.nomeCargo}" já existe.` }
            );
        }

        return await this._cargoDAO.create(cargo, funcionarioLogado);
    };

    /**
     * Retorna todos os cargos cadastrados.
     * 
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mas mantido por consistência).
     * @returns Lista de cargos.
     */
    public findAll = async (): Promise<Cargo[]> => {
        console.log("🟣 CargoService.findAll()");
        const cargos = await this._cargoDAO.findAll();
        return cargos.filter(cargo => cargoAceito(cargo.nomeCargo));
    };


    /**
     * Retorna todos os cargos que foram deletados (soft delete).
     * 
     * 🔹 Requer autenticação: apenas Processo Pedagógico pode visualizar registros deletados.
     * 
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns Lista de cargos deletados.
     */
    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Cargo[]> => {
        console.log("🟣 CargoService.findAllDeleted()");

        // Cargos autorizados a visualizar registros deletados
        const cargosPermitidos = [CARGO_PROCESSO_PEDAGOGICO];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;

        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar cargos deletados.` }
            );
        }

        const cargos = await this._cargoDAO.findAllDeleted();
        return cargos.filter(cargo => cargoAceito(cargo.nomeCargo));
    };


    /**
     * Busca um cargo pelo ID.
     * 
     * @param idCargo - ID do cargo (string hexadecimal do MongoDB).
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns O cargo encontrado ou null se não existir.
     */
    public findById = async (idCargo: string,): Promise<Cargo | null> => {
        console.log("🟣 CargoService.findById()");
        const cargo = new Cargo();
        cargo.idCargo = idCargo; // validação de formato é feita no setter
        return await this._cargoDAO.findById(cargo.idCargo);
    };

    /**
     * Atualiza um cargo existente.
     * 
     * @param cargo - Objeto Cargo com o ID e o novo nome.
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns true se a atualização foi bem-sucedida, false caso contrário.
     */
    public update = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 CargoService.updateCargo()");
        if (funcionarioLogado.cargo.nomeCargo !== CARGO_PROCESSO_PEDAGOGICO) {
            throw new ErrorResponse(403, "Não autorizado");
        }
        const nomeCanonico = nomeCargoCanonico(cargo.nomeCargo);
        if (!nomeCanonico) {
            throw new ErrorResponse(400, "Cargo inválido", {
                message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
            });
        }
        const cargoExistente = await this._cargoDAO.findById(cargo.idCargo);
        if (!cargoExistente) {
            return false;
        }
        cargo.nomeCargo = nomeCanonico;
        return await this._cargoDAO.update(cargo, funcionarioLogado);
    };

    /**
     * Deleta um cargo pelo ID.
     * 
     * @param cargo - Objeto Cargo contendo o ID a ser removido.
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns true se a exclusão foi bem-sucedida, false caso contrário.
     */
    public delete = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 CargoService.delete()");
        return await this._cargoDAO.delete(cargo, funcionarioLogado);
    };

    /**
     * Retorna a quantidade total de cargos cadastrados.
     * 
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns Número total de cargos.
     */
    public count = async (): Promise<number> => {
        console.log("🟣 CargoService.countCargos()");
        return await this._cargoDAO.count();
    };
}
