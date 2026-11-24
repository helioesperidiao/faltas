import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { RegistroController } from "../controllers/RegistroController";
import { RegistroService } from "../services/RegistroService";
import { AbonoDAO } from "../dao/AbonoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { AlunoDAO } from "../dao/AlunoDAO";
import { DispensaDAO } from "../dao/DispensaDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("RegistroRouter");

/**
 * Router responsável por expor os endpoints de registros de falta.
 *
 * Além do CRUD básico, expõe consultas específicas da chamada:
 * - `/ausentes-entrada` — lista alunos ausentes de uma turma num dia
 * - `/chamada`          — devolve a chamada já gravada (turma + dia)
 */
export class RegistroRouter {
    public static readonly PREFIX = "/api/v1/registros";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const registroDAO = new RegistroDAO(dbInstance);
        const alunoDAO = new AlunoDAO(dbInstance);
        const dispensaDAO = new DispensaDAO(dbInstance);
        const registroService = new RegistroService(registroDAO, alunoDAO, dispensaDAO, new AbonoDAO(dbInstance));
        const registroController = new RegistroController(registroService);
        const jwtMiddleware = new JwtMiddleware();

        // Rotas estáticas antes das parametrizadas.
        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(registroController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(registroController.findAll));
        subRouter.get("/deleted", jwtMiddleware.validateToken, asyncHandler(registroController.findAllDeleted));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(registroController.count));
        subRouter.get("/ausentes-entrada", jwtMiddleware.validateToken, asyncHandler(registroController.findAusentesEntrada));
        subRouter.get("/chamada", jwtMiddleware.validateToken, asyncHandler(registroController.findChamadaPorTurmaEDia));
        subRouter.get("/:idRegistro", jwtMiddleware.validateToken, asyncHandler(registroController.findById));
        subRouter.put("/:idRegistro", jwtMiddleware.validateToken, asyncHandler(registroController.update));
        subRouter.delete("/:idRegistro", jwtMiddleware.validateToken, asyncHandler(registroController.delete));

        mainRouter.use(RegistroRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => this._router;
}