import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { FuncionarioController } from "../controllers/FuncionarioController";
import { FuncionarioService } from "../services/FuncionarioService";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

/**
 * Roteador para as rotas da entidade Funcionario.
 * 
 * Define os endpoints RESTful para operações CRUD, autenticação (login)
 * e contagens de funcionários. As rotas são prefixadas com `/api/v1/funcionarios`.
 * 
 * Rotas públicas:
 * - POST /login - Autenticação de funcionário (não requer JWT)
 * 
 * Rotas protegidas (requerem token JWT):
 * - POST / - Criar um novo funcionário
 * - GET / - Listar todos os funcionários
 * - GET /count - Total de funcionários
 * - GET /count/:idCargo - Total de funcionários por cargo
 * - GET /:idFuncionario - Buscar funcionário por ID
 * - PUT /:idFuncionario - Atualizar funcionário
 * - DELETE /:idFuncionario - Deletar funcionário
 * 
 * @example
 * // Uso no servidor
 * const funcionarioRouter = new FuncionarioRouter();
 * app.use(funcionarioRouter.getRouter());
 */
export class FuncionarioRouter {
    /** Prefixo base para todas as rotas de funcionário. */
    public static readonly PREFIX = "/api/v1/funcionarios";

    private _router: Router;

    /**
     * Construtor do FuncionarioRouter.
     * 
     * Inicializa as dependências (MongoDatabase, DAOs, Service, Controller, JwtMiddleware)
     * e configura todas as rotas da entidade Funcionario.
     */
    constructor(private _dataBase: MongoDatabase) {
        console.log("⬆️ FuncionarioRouter.constructor()");

        // Cria um router principal e um sub-router para aplicar o prefixo
        this._router = Router();
        this._dataBase = _dataBase;

     
        const funcionarioDAO = new FuncionarioDAO(this._dataBase);
        const cargoDAO = new CargoDAO(this._dataBase);
        const funcionarioService = new FuncionarioService(funcionarioDAO, cargoDAO);
        const funcionarioController = new FuncionarioController(funcionarioService);
        const jwtMiddleware = new JwtMiddleware();

        // ======================== ROTAS PÚBLICAS ========================

        // POST /login - Autenticação (não requer JWT)
        this._router.post(FuncionarioRouter.PREFIX + "/login",
            funcionarioController.login
        );

        // ======================== ROTAS PROTEGIDAS POR JWT ========================

        // POST / - Criar um novo funcionário
        this._router.post(FuncionarioRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            funcionarioController.create
        );

        // GET / - Listar todos os funcionários
        this._router.get(FuncionarioRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            funcionarioController.findAll
        );

        // GET /count - Total de funcionários
        this._router.get(FuncionarioRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            funcionarioController.count
        );

        // GET /count/:idCargo - Total de funcionários por cargo
        this._router.get(FuncionarioRouter.PREFIX + "/count/:idCargo",
            jwtMiddleware.validateToken,
            funcionarioController.countByCargoId
        );

        // GET /:idFuncionario - Buscar funcionário por ID
        this._router.get(FuncionarioRouter.PREFIX + "/:idFuncionario",
            jwtMiddleware.validateToken,
            funcionarioController.findById
        );

        // PUT /:idFuncionario - Atualizar funcionário
        this._router.put(FuncionarioRouter.PREFIX + "/:idFuncionario",
            jwtMiddleware.validateToken,
            funcionarioController.update
        );

        // DELETE /:idFuncionario - Deletar funcionário
        this._router.delete(FuncionarioRouter.PREFIX + "/:idFuncionario",
            jwtMiddleware.validateToken,
            funcionarioController.delete
        );

    }

    /**
     * Retorna o router principal com todas as rotas configuradas.
     * 
     * @returns Router do Express com as rotas de funcionário.
     */
    public getRouter = (): Router => {
        return this._router;
    };
}