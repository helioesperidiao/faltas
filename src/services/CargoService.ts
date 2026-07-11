import { CargoDAO } from "../dao/CargoDAO";
import { Cargo } from "../models/Cargo";
import { ErrorResponse } from "../http/ErrorResponse";


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
     * Construtor da classe CargoService
     * @param {CargoDAO} cargoDAODependency - Instância de CargoDAO
     */
    constructor(cargoDAODependency: CargoDAO) {
        console.log("⬆️  CargoService.constructor()");
        this._cargoDAO = cargoDAODependency; // injeção de dependência
    }

    /**
     * Cria um novo cargo
     * @param {Object} cargoJson - Dados do cargo { nomeCargo }
     * @returns {Promise<number>} - ID do novo cargo criado
     * 
     * Validações:
     * - nomeCargo não pode estar vazio
     * - Não pode existir outro cargo com mesmo nome
     */
    createCargo = async (cargo: Cargo): Promise<Cargo> => {
        console.log("🟣 CargoService.createCargo()");


        //valida regra de negócio
        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);

        if (resultado.length > 0) {
            throw new ErrorResponse(
                400,
                "Cargo já existe",
                { message: `O cargo ${cargo.nomeCargo} já existe` }
            );
        }

        return this._cargoDAO.create(cargo);
    };

    /**
     * Retorna todos os cargos
     */
    findAll = async (): Promise<Cargo[]> => {
        console.log("🟣 CargoService.findAll()");
        return this._cargoDAO.findAll();
    };

    /**
     * Retorna um cargo por ID
     * @param {string} idCargo - ID do cargo (string hex do MongoDB)
     */
    findById = async (idCargo: string): Promise<Cargo | null> => {
        console.log("🟣 CargoService.findById()");
        const cargo = new Cargo();

        //passa pela validação de regra de dominio.
        cargo.idCargo = idCargo;

        return this._cargoDAO.findById(cargo.idCargo);
    };

    /**
     * Atualiza um cargo existente.
     *

     *
     * @param {string} idCargo - Identificador do cargo a ser atualizado.
     * @param {string} nomeCargo - Nome do cargo (deve ser string não vazia).
     *
     * @returns {Promise<boolean>} - true se atualizado com sucesso.
     * @throws {Error} - Se idCargo for inválido ou nomeCargo não atender às regras de domínio.
     *
     * @example
     * const cargoAtualizado = await cargoService.updateCargo("507f1f77bcf86cd799439011", "Gerente");
     */
    updateCargo = async (cargo: Cargo): Promise<boolean> => {
        console.log("🟣 CargoService.updateCargo()");

   

        return this._cargoDAO.update(cargo);
    };

    /**
     * Deleta um cargo por ID
     * @param {string} idCargo - ID do cargo (string hex)
     */
    delete = async (cargo: Cargo): Promise<boolean> => {
        console.log("🟣 CargoService.deleteCargo()");

        

        //passa como parametro objeto que será excluido
        return this._cargoDAO.delete(cargo);
    };
}