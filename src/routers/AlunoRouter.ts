import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { AlunoController } from "../controllers/AlunoController";
import { AlunoService } from "../services/AlunoService";
import { AlunoDAO } from "../dao/AlunoDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("AlunoRouter");

/**
 * Router responsável por expor os endpoints de alunos.
 *
 * Cobre CRUD, busca por matrícula/turma, listagem de inativos (soft delete)
 * e a virada anual de turma (`/transicao-anual`).
 */
export class AlunoRouter {
    public static readonly PREFIX = "/api/v1/alunos";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const alunoDAO = new AlunoDAO(dbInstance);
        const alunoService = new AlunoService(alunoDAO);
        const alunoController = new AlunoController(alunoService);
        const jwtMiddleware = new JwtMiddleware();

        // ⚠️ Rotas estáticas (/count, /deleted) vêm ANTES das parametrizadas
        // (/:idAluno), senão o Express confunde "count" com um id.
        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(alunoController.create));
        subRouter.post("/importacao/substituir", jwtMiddleware.validateToken, asyncHandler(alunoController.substituirImportacao));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(alunoController.findAll));
        subRouter.get("/deleted", jwtMiddleware.validateToken, asyncHandler(alunoController.findAllDeleted));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(alunoController.count));
        subRouter.post("/transicao-anual", jwtMiddleware.validateToken, asyncHandler(alunoController.promoverTurma));
        subRouter.get("/matricula/:matricula", jwtMiddleware.validateToken, asyncHandler(alunoController.findByMatricula));
        subRouter.get("/turma/:turma", jwtMiddleware.validateToken, asyncHandler(alunoController.findByTurma));
        subRouter.get("/:idAluno", jwtMiddleware.validateToken, asyncHandler(alunoController.findById));
        subRouter.put("/:idAluno", jwtMiddleware.validateToken, asyncHandler(alunoController.update));
        subRouter.delete("/:idAluno", jwtMiddleware.validateToken, asyncHandler(alunoController.delete));

        mainRouter.use(AlunoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => this._router;
}
