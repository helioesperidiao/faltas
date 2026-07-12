import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { CargoController } from "../controllers/CargoController";
import { CargoService } from "../services/CargoService";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

/**
 * Roteador para as rotas da entidade Cargo.
 * 
 * Define os endpoints RESTful para operações CRUD e contagem de cargos.
 * As rotas são prefixadas com `/api/v1/cargos` e protegidas por autenticação JWT,
 * 
 * @example
 * // Uso no servidor
 * const cargoRouter = new CargoRouter();
 * app.use(cargoRouter.getRouter());
 */
export class CargoRouter {
    /** Prefixo base para todas as rotas de cargo. */
    public static readonly PREFIX = "/api/v1/cargos";

    private _router: Router;

    /**
     * Construtor do CargoRouter.
     * 
     * Inicializa as dependências (MongoDatabase, CargoDAO, CargoService, CargoController, JwtMiddleware)
     * e configura todas as rotas da entidade Cargo.
     */
    constructor() {
        console.log("⬆️ CargoRouter.constructor()");

        // Cria um router principal e um sub-router para aplicar o prefixo
        const mainRouter = Router();
        const subRouter = Router();

        // Instancia as dependências
        const mongoDB = new MongoDatabase();
        const cargoDAO = new CargoDAO(mongoDB);
        const cargoService = new CargoService(cargoDAO);
        const cargoController = new CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware();

        // ======================== ROTAS ========================

        // POST / - Criar um novo cargo (requer autenticação)
        subRouter.post(
            "/",
            jwtMiddleware.validateToken,
            cargoController.create
        );

        // GET / - Listar todos os cargos (requer autenticação)
        subRouter.get(
            "/",
            jwtMiddleware.validateToken,
            cargoController.findAll
        );

        // GET /count - Obter total de cargos (público)
        subRouter.get(
            "/count",
            jwtMiddleware.validateToken,
            cargoController.count
        );

        // GET /:idCargo - Buscar cargo por ID (requer autenticação)
        subRouter.get(
            "/:idCargo",
            jwtMiddleware.validateToken,
            cargoController.findById
        );

        // PUT /:idCargo - Atualizar cargo por ID (requer autenticação)
        subRouter.put(
            "/:idCargo",
            jwtMiddleware.validateToken,
            cargoController.update
        );

        // DELETE /:idCargo - Deletar cargo por ID (requer autenticação)
        subRouter.delete(
            "/:idCargo",
            jwtMiddleware.validateToken,
            cargoController.delete
        );

        // Aplica o prefixo no router principal
        mainRouter.use(CargoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    /**
     * Retorna o router principal com todas as rotas configuradas.
     * 
     * @returns Router do Express com as rotas de cargo.
     */
    public getRouter = (): Router => {
        return this._router;
    };
}