import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { FuncionarioController } from "../controllers/FuncionarioController";
import { FuncionarioService } from "../services/FuncionarioService";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioRouter");

/**
 * Router responsável por expor os endpoints de funcionários.
 *
 * Guarda uma referência ao FuncionarioService para que o Server possa
 * chamar `initializeDefaultAdmin()` no startup (criação do admin padrão).
 */
export class FuncionarioRouter {
    public static readonly PREFIX = "/api/v1/funcionarios";

    private _router: Router;
    private _funcionarioService: FuncionarioService;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const funcionarioDAO = new FuncionarioDAO(dbInstance);
        const cargoDAO = new CargoDAO(dbInstance);

        // FuncionarioService precisa do CargoDAO para validar o cargo
        // informado na criação/edição de um funcionário.
        this._funcionarioService = new FuncionarioService(funcionarioDAO, cargoDAO);
        const funcionarioController = new FuncionarioController(this._funcionarioService);
        const jwtMiddleware = new JwtMiddleware();

        // Login é público — sem validateToken.
        subRouter.post("/login", asyncHandler(funcionarioController.login));

        // Todas as demais rotas são protegidas por JWT.
        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(funcionarioController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(funcionarioController.findAll));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(funcionarioController.count));
        subRouter.get("/count/:idCargo", jwtMiddleware.validateToken, asyncHandler(funcionarioController.countByCargoId));
        subRouter.get("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.findById));
        subRouter.put("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.update));
        subRouter.delete("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.delete));

        mainRouter.use(FuncionarioRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => {
        return this._router;
    };

    /** Exposto para o Server chamar `initializeDefaultAdmin()` no boot, depois do schema. */
    public getService = (): FuncionarioService => {
        return this._funcionarioService;
    };
}