import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { AlunoController } from "../controllers/AlunoController";
import { AlunoService } from "../services/AlunoService";
import { AlunoDAO } from "../dao/AlunoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class AlunoRouter {
    public static readonly PREFIX = "/api/v1/alunos";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase) {
        console.log("⬆️ AlunoRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        const alunoDAO = new AlunoDAO(this._dataBase);
        const alunoService = new AlunoService(alunoDAO);
        const alunoController = new AlunoController(alunoService);
        const jwtMiddleware = new JwtMiddleware();

        this._router.post(AlunoRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            alunoController.create
        );

        this._router.get(AlunoRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            alunoController.findAll
        );

        this._router.get(AlunoRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            alunoController.count
        );

        this._router.get(AlunoRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            alunoController.findAllDeleted
        );

        this._router.get(AlunoRouter.PREFIX + "/matricula/:matricula",
            jwtMiddleware.validateToken,
            alunoController.findByMatricula
        );

        this._router.get(AlunoRouter.PREFIX + "/turma/:turma",
            jwtMiddleware.validateToken,
            alunoController.findByTurma
        );

        this._router.get(AlunoRouter.PREFIX + "/:idAluno",
            jwtMiddleware.validateToken,
            alunoController.findById
        );

        this._router.put(AlunoRouter.PREFIX + "/:idAluno",
            jwtMiddleware.validateToken,
            alunoController.update
        );

        this._router.delete(AlunoRouter.PREFIX + "/:idAluno",
            jwtMiddleware.validateToken,
            alunoController.delete
        );
    }

    public getRouter = (): Router => {
        return this._router;
    };
}
