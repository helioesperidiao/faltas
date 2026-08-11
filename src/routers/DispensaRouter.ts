import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { uploadDispensaMiddleware } from "../middlewares/UploadMiddleware";
import { DispensaController } from "../controllers/DispensaController";
import { DispensaService } from "../services/DispensaService";
import { DispensaDAO } from "../dao/DispensaDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class DispensaRouter {
    public static readonly PREFIX = "/api/v1/dispensa";

    private _router: Router;
    private _dataBase: MongoDatabase;

    //construtor
    constructor(dataBase: MongoDatabase){
        console.log("⬆️ DispensaRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        const dispensaDAO = new DispensaDAO(this._dataBase);
        const dispensaService = new DispensaService(dispensaDAO);
        const dispensaController = new DispensaController(dispensaService);
        const jwtMiddleware = new JwtMiddleware();

        //post
        this._router.post(DispensaRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            dispensaController.create
        );

        //post
        this._router.post(DispensaRouter.PREFIX + "/:idDispensa/arquivo",
            jwtMiddleware.validateToken,
            uploadDispensaMiddleware.single("arquivo"),
            dispensaController.uploadArquivo
        );

        //get (findAll)
        this._router.get(DispensaRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            dispensaController.findAll
        );

        //get (count)
        this._router.get(DispensaRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            dispensaController.count
        );

        //get (deleted)
        this._router.get(DispensaRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            dispensaController.findAllDeleted
        );

        //get (findById)
        this._router.get(DispensaRouter.PREFIX + "/:idDispensa",
            jwtMiddleware.validateToken,
            dispensaController.findById
        );

        //put
        this._router.put(DispensaRouter.PREFIX + "/:idDispensa",
            jwtMiddleware.validateToken,
            dispensaController.update
        );

        //delete
        this._router.delete(DispensaRouter.PREFIX + "/:idDispensa",
            jwtMiddleware.validateToken,
            dispensaController.delete
        );
    }

    public getRouter = (): Router => {
        return this._router;
    };
}