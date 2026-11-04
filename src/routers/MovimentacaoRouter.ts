import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { MovimentacaoController } from "../controllers/MovimentacaoController";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("MovimentacaoRouter");

/**
 * Router responsável por expor os endpoints de movimentação (entrada/saída).
 *
 * GET aceita querystring opcional `data=AAAA-MM-DD` para filtrar por dia.
 */
export class MovimentacaoRouter {
    public static readonly PREFIX = "/api/v1/movimentacoes";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const movimentacaoDAO = new MovimentacaoDAO(dbInstance);
        const movimentacaoService = new MovimentacaoService(movimentacaoDAO);
        const movimentacaoController = new MovimentacaoController(movimentacaoService);
        const jwtMiddleware = new JwtMiddleware();

        subRouter.post("/lote", jwtMiddleware.validateToken, asyncHandler(movimentacaoController.createLote));
        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(movimentacaoController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(movimentacaoController.findAll));

        mainRouter.use(MovimentacaoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => this._router;
}
