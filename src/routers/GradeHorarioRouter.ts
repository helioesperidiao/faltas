import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { GradeHorarioController } from "../controllers/GradeHorarioController";
import { GradeHorarioService } from "../services/GradeHorarioService";
import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class GradeHorarioRouter {
    public static readonly PREFIX = "/api/v1/gradehorarios";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase) {
        console.log("⬆️ GradeHorarioRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        const gradeHorarioDAO = new GradeHorarioDAO(this._dataBase);
        const gradeHorarioService = new GradeHorarioService(gradeHorarioDAO);
        const gradeHorarioController = new GradeHorarioController(gradeHorarioService);
        const jwtMiddleware = new JwtMiddleware();

        this._router.post(GradeHorarioRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            gradeHorarioController.create
        );

        this._router.get(GradeHorarioRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            gradeHorarioController.findAll
        );

        this._router.get(GradeHorarioRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            gradeHorarioController.count
        );

        this._router.get(GradeHorarioRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            gradeHorarioController.findAllDeleted
        );

        this._router.get(GradeHorarioRouter.PREFIX + "/turma/:turma",
            jwtMiddleware.validateToken,
            gradeHorarioController.findByTurma
        );

        this._router.get(GradeHorarioRouter.PREFIX + "/:idGradeHorario",
            jwtMiddleware.validateToken,
            gradeHorarioController.findById
        );

        this._router.put(GradeHorarioRouter.PREFIX + "/:idGradeHorario",
            jwtMiddleware.validateToken,
            gradeHorarioController.update
        );

        this._router.delete(GradeHorarioRouter.PREFIX + "/:idGradeHorario",
            jwtMiddleware.validateToken,
            gradeHorarioController.delete
        );
    }

    public getRouter = (): Router => {
        return this._router;
    };
}
