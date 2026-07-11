import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { FuncionarioController } from "../controllers/FuncionarioController";
import { FuncionarioService } from "../services/FuncionarioService";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class FuncionarioRouter {
    public static readonly PREFIX = "/api/v1/funcionarios";
    private _router: Router;

    constructor() {
        console.log("⬆️ FuncionarioRouter.constructor()");
        this._router = Router();

        // Instancia dependências
        const mongoDB = new MongoDatabase();
        const funcionarioDAO = new FuncionarioDAO(mongoDB);
        const cargoDAO = new CargoDAO(mongoDB);
        const funcionarioService = new FuncionarioService(funcionarioDAO, cargoDAO);
        const funcionarioController = new FuncionarioController(funcionarioService);
        const jwtMiddleware = new JwtMiddleware();


        // ROTA: POST /login (pública)
        this._router.post(FuncionarioRouter.PREFIX + "/login",
            funcionarioController.login
        );

        // ROTA: POST / (protegida)
        this._router.post(FuncionarioRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            funcionarioController.create
        );

        // ROTA: PUT /:idFuncionario (protegida)
        this._router.put(FuncionarioRouter.PREFIX + "/:idFuncionario",
            jwtMiddleware.validateToken,
            funcionarioController.update
        );

        // ROTA: DELETE /:idFuncionario (protegida)
        this._router.delete(FuncionarioRouter.PREFIX + "/:idFuncionario",
            jwtMiddleware.validateToken,
            funcionarioController.delete
        );

        // ROTA: GET / (protegida)
        this._router.get(FuncionarioRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            funcionarioController.findAll
        );

        // ROTA: GET /:idFuncionario (protegida)
        this._router.get(FuncionarioRouter.PREFIX + "/:idFuncionario",
            jwtMiddleware.validateToken,
            funcionarioController.findById
        );
    }

    getRouter(): Router {
        return this._router;
    }
}