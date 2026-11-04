import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { DispensaController } from "../controllers/DispensaController";
import { DispensaService } from "../services/DispensaService";
import { DispensaDAO } from "../dao/DispensaDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { uploadDispensaMiddleware } from "../middlewares/UploadMiddleware";
import { createLogger } from "../logging/Logger";

const log = createLogger("DispensaRouter");

/**
 * Router responsável por expor os endpoints de dispensas.
 *
 * O endpoint `/arquivo` recebe o anexo (jpg/pdf) via multipart/form-data;
 * o multer é aplicado apenas nessa rota para não interferir no JSON das demais.
 */
export class DispensaRouter {
    public static readonly PREFIX = "/api/v1/dispensas";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const dispensaDAO = new DispensaDAO(dbInstance);
        const dispensaService = new DispensaService(dispensaDAO);
        const dispensaController = new DispensaController(dispensaService);
        const jwtMiddleware = new JwtMiddleware();

        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(dispensaController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(dispensaController.findAll));
        subRouter.get("/deleted", jwtMiddleware.validateToken, asyncHandler(dispensaController.findAllDeleted));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(dispensaController.count));
        subRouter.post(
            "/:idDispensa/arquivo",
            jwtMiddleware.validateToken,
            uploadDispensaMiddleware.single("arquivo"),
            asyncHandler(dispensaController.uploadArquivo)
        );
        subRouter.get("/:idDispensa", jwtMiddleware.validateToken, asyncHandler(dispensaController.findById));
        subRouter.put("/:idDispensa", jwtMiddleware.validateToken, asyncHandler(dispensaController.update));
        subRouter.delete("/:idDispensa", jwtMiddleware.validateToken, asyncHandler(dispensaController.delete));

        mainRouter.use(DispensaRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => this._router;
}