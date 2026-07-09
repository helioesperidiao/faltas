import { Request, Response, NextFunction } from "express";
import { FuncionarioService } from "../services/FuncionarioService";

/**
 * Classe responsável por controlar os endpoints da API REST para a entidade Funcionario.
 * 
 * Implementa métodos de CRUD e autenticação, utilizando injeção de dependência
 * para receber a instância de FuncionarioService, desacoplando a lógica de negócio
 * da camada de controle.
 */
export class FuncionarioController {
    private _funcionarioService: FuncionarioService;

    /**
     * Construtor da classe FuncionarioControl
     * @param {FuncionarioService} funcionarioServiceDependency - Instância do FuncionarioService
     * 
     * A injeção de dependência permite:
     * - Testes unitários fáceis com mocks;
     * - Troca de implementação do serviço sem alterar o controlador;
     * - Maior desacoplamento entre camadas.
     */
    constructor(funcionarioServiceDependency: FuncionarioService) {
        console.log("⬆️  FuncionarioControl.constructor()");
        this._funcionarioService = funcionarioServiceDependency;
    }

    /**
     * Autentica um funcionário pelo email e senha.
     * @param {Request} request - Objeto da requisição Express.js contendo email e senha.
     * @param {Response} response - Objeto da resposta Express.js.
     * @param {NextFunction} next - Middleware de tratamento de erros.
     * 
     * Retorna JSON com os dados do funcionário autenticado ou encaminha o erro.
     */
    login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        console.log("🔵 FuncionarioControl.login()");
        try {
            const jsonFuncionario = request.body.funcionario;
            const resultado = await this._funcionarioService.loginFuncionario(jsonFuncionario);

            response.status(200).json({
                success: true,
                message: "Login efetuado com sucesso!",
                data: resultado
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cria um novo funcionário.
     * @param {Request} request - Objeto da requisição Express.js com os dados do funcionário.
     * @param {Response} response - Objeto da resposta Express.js.
     * @param {NextFunction} next - Middleware de tratamento de erros.
     * 
     * Retorna JSON com o ID do funcionário criado e mensagem de sucesso.
     */
    create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        console.log("🔵 FuncionarioControl.create()");
        try {
            const jsonFuncionario = request.body.funcionario;
            console.log(jsonFuncionario)
            const resultado = await this._funcionarioService.create(jsonFuncionario);

            response.status(200).json({
                success: true,
                message: "Cadastro realizado com sucesso",
                data: { funcionario: resultado }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lista todos os funcionários cadastrados.
     * @param {Request} _request - Objeto da requisição Express.js.
     * @param {Response} response - Objeto da resposta Express.js.
     * @param {NextFunction} next - Middleware de tratamento de erros.
     * 
     * Retorna JSON com array de funcionários.
     */
    findAll = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
        console.log("🔵 FuncionarioControl.index()");
        try {
            const listaFuncionarios = await this._funcionarioService.findAll();

            response.status(200).json({
                success: true,
                message: "Executado com sucesso",
                data: { funcionarios: listaFuncionarios }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Busca um funcionário pelo ID.
     * @param {Request} request - Objeto da requisição Express.js.
     * @param {Response} response - Objeto da resposta Express.js.
     * @param {NextFunction} next - Middleware de tratamento de erros.
     * 
     * Retorna JSON com os dados do funcionário encontrado.
     */
    findById = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        console.log("🔵 FuncionarioControl.show()");
        try {
            const idFuncionario = request.params.idFuncionario.toString();
            const funcionario = await this._funcionarioService.findById(idFuncionario);

            response.status(200).json({
                success: true,
                message: "Executado com sucesso",
                data: funcionario
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Atualiza os dados de um funcionário existente.
     * @param {Request} request - Objeto da requisição Express.js com os dados atualizados.
     * @param {Response} response - Objeto da resposta Express.js.
     * @param {NextFunction} next - Middleware de tratamento de erros.
     * 
     * Retorna JSON com os dados atualizados do funcionário ou encaminha o erro.
     */
    update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        console.log("🔵 FuncionarioControl.update()");
        try {
            const idFuncionario = request.params.idFuncionario.toString();
            await this._funcionarioService.updateFuncionario(idFuncionario, request.body);

            response.status(200).json({
                success: true,
                message: "Atualizado com sucesso",
                data: {
                    funcionario: {
                        idFuncionario: idFuncionario,
                        nomeFuncionario: request.body.funcionario.nomeFuncionario
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Remove um funcionário pelo ID.
     * @param {Request} request - Objeto da requisição Express.js.
     * @param {Response} response - Objeto da resposta Express.js.
     * @param {NextFunction} next - Middleware de tratamento de erros.
     * 
     * Retorna status 204 se excluído com sucesso ou 404 se o funcionário não existir.
     */
    delete = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        console.log("🔵 FuncionarioControl.delete("+request.params.idFuncionario.toString()+")");
        try {
            const idFuncionario = request.params.idFuncionario.toString();
            const excluiu = await this._funcionarioService.deleteFuncionario(idFuncionario);

            if (!excluiu) {
                response.status(404).json({
                    success: false,
                    message: "Funcionário não encontrado",
                    error: { message: `Não existe funcionário com id ${idFuncionario}` }
                });
                return;
            }

            response.status(204).json({
                success: true,
                message: "Excluído com sucesso"
            });
        } catch (error) {
            next(error);
        }
    };
}