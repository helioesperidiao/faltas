import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
import { MeuTokenJWT } from "../http/MeuTokenJWT";

/**
 * Classe responsável pela camada de serviço para a entidade Funcionario.
 * 
 * Observações sobre injeção de dependência:
 * - O FuncionarioService recebe uma instância de FuncionarioDAO via construtor.
 * - Isso desacopla o serviço da implementação concreta do DAO.
 * - Facilita testes unitários e uso de mocks.
 */
export class FuncionarioService {
    private _funcionarioDAO: FuncionarioDAO;
    private _cargoDAO: CargoDAO;

    /**
     * Construtor da classe FuncionarioService
     * @param {FuncionarioDAO} funcionarioDAODependency - Instância de FuncionarioDAO
     * @param {CargoDAO} cargoDAODependency - Instância de CargoDAO
     */
    constructor(funcionarioDAODependency: FuncionarioDAO, cargoDAODependency: CargoDAO) {
        console.log("⬆️  FuncionarioService.constructor()");
        this._funcionarioDAO = funcionarioDAODependency; // injeção de dependência
        this._cargoDAO = cargoDAODependency;
    }

    /**
     * Cria um novo funcionário.
     *
     * @param {Object} jsonFuncionario - Objeto contendo dados do funcionário
     * @param {Object} jsonFuncionario.funcionario - Dados do funcionário
     * @param {string} requestBody.funcionario.nomeFuncionario - Nome do funcionário
     * @param {string} requestBody.funcionario.email - Email do funcionário
     * @param {string} requestBody.funcionario.senha - Senha do funcionário
     * @param {boolean} requestBody.funcionario.recebeValeTransporte - Se recebe vale transporte
     * @param {Object} requestBody.funcionario.cargo - Objeto cargo
     * @param {number|string} requestBody.funcionario.cargo.idCargo - ID do cargo
     *
     * @returns {Promise<Funcionario>} - Objeto Funcionario criado com ID atribuído
     * @throws {ErrorResponse} - Em caso de validação de dados inválidos ou email já existente
     *
     * @example
     * const funcionario = await funcionarioService.createFuncionario({ funcionario: {...} });
     */
    createFuncionario = async (jsonFuncionario: any): Promise<Funcionario> => {
        console.log("🟣 FuncionarioService.createFuncionario()");

        // Criar o cargo que será utilizado pelo funcionário
        const objetoCargo = new Cargo();
        objetoCargo.idCargo = jsonFuncionario.cargo.idCargo; // regra de dominio

        // Criação da instância Funcionario
        const objFuncionario = new Funcionario();

        // Aplica regra de dominio (chama os setters da classe Funcionario)
        objFuncionario.nomeFuncionario = jsonFuncionario.nomeFuncionario;
        objFuncionario.email = jsonFuncionario.email;
        objFuncionario.senha = jsonFuncionario.senha;
        objFuncionario.recebeValeTransporte = jsonFuncionario.recebeValeTransporte;
        objFuncionario.cargo = objetoCargo;

        // Regra de negócio: verificar se cargo fornecido existe antes de cadastrar
        const cargoExiste = await this._cargoDAO.findByField("_id", objFuncionario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse(
                400,
                "O cargo informado não existe",
                { message: `O cargo com id ${objFuncionario.cargo.idCargo} não foi encontrado` }
            );
        }

        // Regra de negócio: verificação de email duplicado
        const emailExiste = await this._funcionarioDAO.findByField("email", objFuncionario.email);
        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse(
                400,
                "Já existe um Funcionário com o email fornecido",
                { message: `O email ${objFuncionario.email} já está cadastrado` }
            );
        }

        // Persistência e atribuição de ID
        objFuncionario.idFuncionario = await this._funcionarioDAO.create(objFuncionario);

        return objFuncionario;
    };

    /**
     * Realiza o login de um funcionário.
     *
     * 🔹 Regra de aplicação: valida as credenciais do usuário e retorna um token JWT.
     *
     * @param {Object} jsonFuncionario - Objeto contendo os dados de login.
     * @param {Object} jsonFuncionario.funcionario - Dados do funcionário para login.
     * @param {string} requestBody.funcionario.email - Email do funcionário.
     * @param {string} requestBody.funcionario.senha - Senha do funcionário.
     *
     * @returns {Promise<Object>} - Retorna um objeto contendo:
     *                              { user: { idFuncionario, name, email, role }, token }
     *
     * @throws {ErrorResponse} - Lança erro 401 se usuário ou senha forem inválidos,
     *                            ou erro 500 em caso de falha interna.
     *
     * @example
     * const resultado = await funcionarioService.loginFuncionario({
     *   funcionario: { email: "teste@dominio.com", senha: "123456" }
     * });
     * console.log(resultado.user, resultado.token);
     */
    loginFuncionario = async (jsonFuncionario: any): Promise<{ user: any; token: string }> => {
        console.log("🟣 FuncionarioService.loginFuncionario()");

        const objetoFuncionario = new Funcionario();
        objetoFuncionario.email = jsonFuncionario.email;
        objetoFuncionario.senha = jsonFuncionario.senha;

        // Consulta no DAO
        const encontrado = await this._funcionarioDAO.login(objetoFuncionario);

        if (!encontrado) {
            throw new ErrorResponse(401, "Usuário ou senha inválidos", { message: "Não foi possível realizar autenticação" });
        }

        // Geração de token JWT
        const jwt = new MeuTokenJWT();
        const user = {
            funcionario: {
                email: encontrado.email,
                role: encontrado.cargo?.nomeCargo || null,
                name: encontrado.nomeFuncionario || null,
                idFuncionario: encontrado.idFuncionario
            }
        };

        return { user, token: jwt.gerarToken(user.funcionario) };
    };

    /**
     * Retorna todos os funcionários
     * @returns {Promise<any[]>} - Lista de funcionários
     */
    findAll = async (): Promise<any[]> => {
        console.log("🟣 FuncionarioService.findAll()");
        return this._funcionarioDAO.findAll();
    };

    /**
     * Retorna um funcionário pelo ID
     * @param {string} idFuncionario - ID do funcionário
     * @returns {Promise<any>} - Objeto Funcionario encontrado
     * @throws {ErrorResponse} - Em caso de ID inválido ou funcionário não encontrado
     */
    findById = async (idFuncionario: string): Promise<any> => {
        const objFuncionario = new Funcionario();
        objFuncionario.idFuncionario = idFuncionario;

        const funcionario = await this._funcionarioDAO.findById(objFuncionario.idFuncionario);

        if (!funcionario) {
            throw new ErrorResponse(404, "Funcionário não encontrado", { message: `Não existe funcionário com id ${idFuncionario}` });
        }

        return funcionario;
    };

    /**
     * Atualiza um funcionário
     * @param {string} idFuncionario - ID do funcionário
     * @param {Object} requestBody - Dados atualizados do funcionário
     * @param {Object} requestBody.funcionario - Dados do funcionário
     * @returns {Promise<boolean>} - True se atualizado com sucesso
     * @throws {ErrorResponse} - Em caso de dados inválidos
     */
    updateFuncionario = async (idFuncionario: string, requestBody: any): Promise<boolean> => {
        console.log("🟣 FuncionarioService.updateFuncionario()");
        const jsonFuncionario = requestBody.funcionario;

        const objCargo = new Cargo();
        objCargo.idCargo = jsonFuncionario.cargo.idCargo;

        // Validação das regras de dominio
        const objFuncionario = new Funcionario();
        objFuncionario.idFuncionario = idFuncionario;
        objFuncionario.nomeFuncionario = jsonFuncionario.nomeFuncionario;
        objFuncionario.email = jsonFuncionario.email;
        objFuncionario.senha = jsonFuncionario.senha;
        objFuncionario.recebeValeTransporte = jsonFuncionario.recebeValeTransporte;
        objFuncionario.cargo = objCargo;

        // Envia um objeto válido de funcionario para atualizar
        return await this._funcionarioDAO.update(objFuncionario);
    };

    /**
     * Exclui um funcionário
     * @param {string} idFuncionario - ID do funcionário
     * @returns {Promise<boolean>} - True se excluído com sucesso
     * @throws {ErrorResponse} - Em caso de ID inválido
     */
    deleteFuncionario = async (idFuncionario: string): Promise<boolean> => {
        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;
        return await this._funcionarioDAO.delete(funcionario);
    };
}