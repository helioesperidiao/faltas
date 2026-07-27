import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { RegistroController} from "../controllers/RegistroController";
import { RegistroService } from "../services/RegistroService";
import { RegistroDAO } from "../dao/RegistroDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class RegistroRouter {
    public static readonly PREFIX= "/api/v1/registro";

    private _router: Router;
    private _dataBase: MongoDatabase;

    //construtor
    constructor(dataBase: MongoDatabase){
        console.log("⬆️ RegistroRouter.constructor()");
        this._router = Router();
        this._dataBase= dataBase;   
        const registroDAO = new RegistroDAO(this._dataBase);
        const registroService = new RegistroService(registroDAO);  
        const registroController = new RegistroController(registroService);
        const jwtMiddleware = new JwtMiddleware();

        //post
        this._router.post(RegistroRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            registroController.create
        );

        //get (findAll)
        this._router.get(RegistroRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            registroController.findAll
        );

        //get (count)
        this._router.get(RegistroRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            registroController.count
        );

        //get (delete)
        this._router.get(RegistroRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            registroController.findAllDeleted
        );

        //get (findById)
        this._router.get(RegistroRouter.PREFIX + "/:idRegistro",
            jwtMiddleware.validateToken,
            registroController.findById
        );

        //put 
        this._router.put(RegistroRouter.PREFIX + "/:idRegistro",
            jwtMiddleware.validateToken,
            registroController.update
        );

        //delete
        this._router.delete(RegistroRouter.PREFIX + "/:idRegistro",
            jwtMiddleware.validateToken,
            registroController.delete
        );
    }
    public getRouter = (): Router => {
        return this._router;
    };
}