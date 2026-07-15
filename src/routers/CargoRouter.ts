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
    private _dataBase: MongoDatabase;

    /**
     * Construtor do CargoRouter.
     * 
     * Inicializa as dependências (MongoDatabase, CargoDAO, CargoService, CargoController, JwtMiddleware)
     * e configura todas as rotas da entidade Cargo.
     */
    constructor(dataBase: MongoDatabase) {
        console.log("⬆️ CargoRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        // Instancia as dependências
        ///const mongoDB = new MongoDatabase();
        const cargoDAO = new CargoDAO(this._dataBase);
        const cargoService = new CargoService(cargoDAO);
        const cargoController = new CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware();

        // ======================== ROTAS ========================

        // POST / - Criar um novo cargo (requer autenticação)
        this._router.post(CargoRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            cargoController.create
        );

        // GET / - Listar todos os cargos (requer autenticação)
        this._router.get(CargoRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            cargoController.findAll
        );

        // GET /count - Obter total de cargos (público)
        this._router.get(CargoRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            cargoController.count
        );

        this._router.get(CargoRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            cargoController.findAllDeleted
        );

        // GET /:idCargo - Buscar cargo por ID (requer autenticação)
        this._router.get(CargoRouter.PREFIX + "/:idCargo",
            jwtMiddleware.validateToken,
            cargoController.findById
        );

        // PUT /:idCargo - Atualizar cargo por ID (requer autenticação)
        this._router.put(CargoRouter.PREFIX + "/:idCargo",
            jwtMiddleware.validateToken,
            cargoController.update
        );

        // DELETE /:idCargo - Deletar cargo por ID (requer autenticação)
        this._router.delete(CargoRouter.PREFIX + "/:idCargo",
            jwtMiddleware.validateToken,
            cargoController.delete
        );


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