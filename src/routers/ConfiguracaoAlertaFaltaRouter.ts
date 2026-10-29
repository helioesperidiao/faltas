import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { ConfiguracaoAlertaFaltaController } from "../controllers/ConfiguracaoAlertaFaltaController";
import { ConfiguracaoAlertaFaltaService } from "../services/ConfiguracaoAlertaFaltaService";
import { ConfiguracaoAlertaFaltaDAO } from "../dao/ConfiguracaoAlertaFaltaDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("ConfiguracaoAlertaFaltaRouter");

/**
 * Router responsável por expor os endpoints de configuração de alerta de faltas.
 *
 * As rotas vivem sob `/configuracoes` para que o mesmo router possa, no futuro,
 * expor outras operações do módulo de alertas sem colidir de nomes.
 */
export class ConfiguracaoAlertaFaltaRouter {
    public static readonly PREFIX = "/api/v1/alertas-faltas";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const configuracaoDAO = new ConfiguracaoAlertaFaltaDAO(dbInstance);
        const configuracaoService = new ConfiguracaoAlertaFaltaService(configuracaoDAO);
        const configuracaoController = new ConfiguracaoAlertaFaltaController(configuracaoService);
        const jwtMiddleware = new JwtMiddleware();

        subRouter.get("/configuracoes", jwtMiddleware.validateToken, asyncHandler(configuracaoController.findAll));
        subRouter.post("/configuracoes", jwtMiddleware.validateToken, asyncHandler(configuracaoController.create));
        subRouter.put("/configuracoes/:idConfiguracao", jwtMiddleware.validateToken, asyncHandler(configuracaoController.update));
        subRouter.delete("/configuracoes/:idConfiguracao", jwtMiddleware.validateToken, asyncHandler(configuracaoController.delete));

        mainRouter.use(ConfiguracaoAlertaFaltaRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => this._router;
}