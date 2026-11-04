import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { CargoController } from "../controllers/CargoController";
import { CargoService } from "../services/CargoService";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoRouter");

/**
 * Router responsável por expor os endpoints de cargos.
 *
 * Recebe a instância de MongoDatabase por injeção para reaproveitar a
 * conexão singleton já aberta pelo Server.
 */
export class CargoRouter {
    public static readonly PREFIX = "/api/v1/cargos";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        // Monta a cadeia DAO → Service → Controller com a conexão compartilhada
        const cargoDAO = new CargoDAO(dbInstance);
        const funcionarioDAO = new FuncionarioDAO(dbInstance);

        // CargoService precisa do FuncionarioDAO para impedir exclusão de cargos
        // com funcionários vinculados.
        const cargoService = new CargoService(cargoDAO, funcionarioDAO);
        const cargoController = new CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware();

        // Todas as rotas são protegidas por JWT. O `asyncHandler` garante que
        // erros lançados nos controllers `async` cheguem ao middleware de erro
        // global (onde são logados).
        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(cargoController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(cargoController.findAll));
        subRouter.get("/deleted", jwtMiddleware.validateToken, asyncHandler(cargoController.findAllDeleted));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(cargoController.count));
        subRouter.get("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.findById));
        subRouter.put("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.update));
        subRouter.delete("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.delete));

        mainRouter.use(CargoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => {
        return this._router;
    };
}