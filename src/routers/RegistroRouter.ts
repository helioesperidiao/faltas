import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { RegistroController} from "../controllers/RegistroController";
import { RegistroService } from "../services/RegistroService";
import { RegistroDAO } from "../dao/RegistroDAO";
import { AlunoDAO } from "../dao/AlunoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class RegistroRouter {
    public static readonly PREFIX= "/api/v1/registro";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase){
        console.log("⬆️ RegistroRouter.constructor()");
        this._router = Router();
        this._dataBase= dataBase;
        const registroDAO = new RegistroDAO(this._dataBase);
        const alunoDAO = new AlunoDAO(this._dataBase);
        const registroService = new RegistroService(registroDAO, alunoDAO);
        const registroController = new RegistroController(registroService);
        const jwtMiddleware = new JwtMiddleware();

        this._router.post(RegistroRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            registroController.create
        );

        this._router.get(RegistroRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            registroController.findAll
        );

        this._router.get(RegistroRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            registroController.count
        );

        this._router.get(RegistroRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            registroController.findAllDeleted
        );

        this._router.get(RegistroRouter.PREFIX + "/ausentes-entrada",
            jwtMiddleware.validateToken,
            registroController.findAusentesEntrada
        );

        this._router.get(RegistroRouter.PREFIX + "/:idRegistro",
            jwtMiddleware.validateToken,
            registroController.findById
        );

        this._router.put(RegistroRouter.PREFIX + "/:idRegistro",
            jwtMiddleware.validateToken,
            registroController.update
        );

        this._router.delete(RegistroRouter.PREFIX + "/:idRegistro",
            jwtMiddleware.validateToken,
            registroController.delete
        );
    }
    public getRouter = (): Router => {
        return this._router;
    };
}