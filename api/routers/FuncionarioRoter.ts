import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { FuncionarioMiddleware } from "../middlewares/FuncionarioMiddleware";
import { FuncionarioController } from "../controllers/FuncionarioController";


/**
 * Classe responsável por configurar as rotas da entidade Funcionario.
 * 
 * Observações sobre injeção de dependência:
 * - O roteador não cria suas próprias instâncias de middlewares ou controladores.
 * - Ele recebe instâncias externas de JwtMiddleware, FuncionarioMiddleware e FuncionarioControle via construtor.
 * - Isso permite:
 *      - Testes unitários com mocks ou stubs;
 *      - Troca de implementações sem alterar o roteador;
 *      - Segue o princípio de inversão de dependência (SOLID).
 */
export class FuncionarioRouter {
    private _router: Router;
    private _jwtMiddleware: JwtMiddleware;
    private _funcionarioMiddleware: FuncionarioMiddleware;
    private _funcionarioControl: FuncionarioController;

    /**
     * Construtor da classe FuncionarioRoteador
     * 
     * Injeção de dependência:
     * @param {JwtMiddleware} jwtMiddleware - Middleware JWT externo injetado
     * @param {FuncionarioMiddleware} funcionarioMiddleware - Middleware de validação de Funcionario injetado
     * @param {FuncionarioControl} funcionarioController - Controlador de Funcionario injetado
     */
    constructor(
        jwtMiddleware: JwtMiddleware,
        funcionarioMiddleware: FuncionarioMiddleware,
        funcionarioController: FuncionarioController
    ) {
        console.log("⬆️  FuncionarioRoteador.constructor()");
        this._router = Router();

        // Armazenando as instâncias injetadas
        this._jwtMiddleware = jwtMiddleware;
        this._funcionarioMiddleware = funcionarioMiddleware;
        this._funcionarioControl = funcionarioController;
    }

    /**
     * Configura as rotas da API REST para a entidade Funcionario.
     * 
     * Rotas configuradas:
     * POST "/login"                    -> Efetuar login do funcionário
     * POST "/"                          -> Criar um novo Funcionario (validação JWT + body)
     * PUT "/:idFuncionario"             -> Atualizar Funcionario por ID (validação JWT + id param + body)
     * DELETE "/:idFuncionario"          -> Deletar Funcionario por ID (validação JWT + id param)
     * GET "/"                           -> Listar todos os Funcionarios (validação JWT)
     * GET "/:idFuncionario"             -> Buscar Funcionario por ID (validação JWT + id param)
     * 
     * Todas as dependências (JWT, middleware de validação, controlador) são fornecidas externamente,
     * permitindo maior flexibilidade e testabilidade do código.
     * 
     * @returns {Router} Router configurado com todas as rotas de Funcionario
     */
    createRoutes = (): Router => {
        console.log("⬆️  FuncionarioRoteador.createRoutes()");

        // ROTA: POST[/funcionarios/login]
        this._router.post(
            "/login",
            this._funcionarioMiddleware.validateLoginBody,
            this._funcionarioControl.login
        );

        // ROTA: POST[/funcionarios]
        this._router.post(
            "/",
            this._jwtMiddleware.validateToken,
            this._funcionarioMiddleware.validateCreateBody,
            this._funcionarioControl.store
        );

        // ROTA: PUT[/funcionarios/:idFuncionario]
        this._router.put(
            "/:idFuncionario",
            this._jwtMiddleware.validateToken,
            this._funcionarioMiddleware.validateIdParam,
            this._funcionarioMiddleware.validateCreateBody,
            this._funcionarioControl.update
        );

        // ROTA: DELETE[/funcionarios/:idFuncionario]
        this._router.delete(
            "/:idFuncionario",
            this._jwtMiddleware.validateToken,
            this._funcionarioMiddleware.validateIdParam,
            this._funcionarioControl.destroy
        );

        // ROTA: GET[/funcionarios]
        this._router.get(
            "/",
            this._jwtMiddleware.validateToken,
            this._funcionarioControl.index
        );

        // ROTA: GET[/funcionarios/:idFuncionario]
        this._router.get(
            "/:idFuncionario",
            this._jwtMiddleware.validateToken,
            this._funcionarioMiddleware.validateIdParam,
            this._funcionarioControl.show
        );

        return this._router;
    };
}