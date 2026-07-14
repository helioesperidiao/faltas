import { CargoDAO } from "../dao/CargoDAO";
import { Cargo } from "../models/Cargo";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

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
     * 🔹 Regra de negócio: apenas usuários com cargo "Administrador" podem criar novos cargos.
     * 🔹 Regra de negócio: não pode existir outro cargo com o mesmo nome.
     * 
     * @param cargo - Objeto Cargo a ser criado.
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns O cargo criado com o ID preenchido.
     * @throws {ErrorResponse} Se o usuário não for Administrador ou se o cargo já existir.
     */
   public create = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> => {
        console.log("🟣 CargoService.createCargo()");

        if (funcionarioLogado.cargo.nomeCargo !== "Administrador") {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não é autorizado a criar cargos.` }
            );
        }

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
        return await this._cargoDAO.findAll();
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
        return await this._cargoDAO.update(cargo, funcionarioLogado );
    };

    /**
     * Deleta um cargo pelo ID.
     * 
     * @param cargo - Objeto Cargo contendo o ID a ser removido.
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns true se a exclusão foi bem-sucedida, false caso contrário.
     */
  public  delete = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
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