import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { GradeHorarioController } from "../controllers/GradeHorarioController";
import { GradeHorarioService } from "../services/GradeHorarioService";
import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("GradeHorarioRouter");

/**
 * Router responsável por expor os endpoints de grade de horários.
 *
 * Além do CRUD, expõe `/turma/:turma` para montar a grade completa de uma
 * turma em uma única chamada.
 */
export class GradeHorarioRouter {
    public static readonly PREFIX = "/api/v1/gradehorarios";

    private _router: Router;

    constructor(dbInstance: MongoDatabase) {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const gradeHorarioDAO = new GradeHorarioDAO(dbInstance);
        const gradeHorarioService = new GradeHorarioService(gradeHorarioDAO);
        const gradeHorarioController = new GradeHorarioController(gradeHorarioService);
        const jwtMiddleware = new JwtMiddleware();

        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.create));
        subRouter.post("/importacao/substituir", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.substituirImportacao));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.findAll));
        subRouter.get("/deleted", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.findAllDeleted));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.count));
        subRouter.get("/turma/:turma", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.findByTurma));
        subRouter.get("/:idGradeHorario", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.findById));
        subRouter.put("/:idGradeHorario", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.update));
        subRouter.delete("/:idGradeHorario", jwtMiddleware.validateToken, asyncHandler(gradeHorarioController.delete));

        mainRouter.use(GradeHorarioRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => this._router;
}
