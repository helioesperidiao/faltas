import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { uploadAbonoMiddleware } from "../middlewares/UploadMiddleware";
import { AbonoController } from "../controllers/AbonoController";
import { AbonoService } from "../services/AbonoService";
import { AbonoDAO } from "../dao/AbonoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { AlunoDAO } from "../dao/AlunoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class AbonoRouter {
    public static readonly PREFIX = "/api/v1/abonos";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase) {
        console.log("⬆️ AbonoRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        const abonoDAO = new AbonoDAO(this._dataBase);
        const registroDAO = new RegistroDAO(this._dataBase);
        const alunoDAO = new AlunoDAO(this._dataBase);
        const abonoService = new AbonoService(abonoDAO, registroDAO, alunoDAO);
        const abonoController = new AbonoController(abonoService);
        const jwtMiddleware = new JwtMiddleware();

        this._router.post(AbonoRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            abonoController.create
        );

        this._router.post(AbonoRouter.PREFIX + "/:idAbono/arquivo",
            jwtMiddleware.validateToken,
            uploadAbonoMiddleware.single("arquivo"),
            abonoController.uploadArquivo
        );

        this._router.put(AbonoRouter.PREFIX + "/:idAbono/aprovar",
            jwtMiddleware.validateToken,
            abonoController.aprovar
        );

        this._router.put(AbonoRouter.PREFIX + "/:idAbono/rejeitar",
            jwtMiddleware.validateToken,
            abonoController.rejeitar
        );

        this._router.get(AbonoRouter.PREFIX + "/",
            jwtMiddleware.validateToken,
            abonoController.findAll
        );

        this._router.get(AbonoRouter.PREFIX + "/count",
            jwtMiddleware.validateToken,
            abonoController.count
        );

        this._router.get(AbonoRouter.PREFIX + "/deleted",
            jwtMiddleware.validateToken,
            abonoController.findAllDeleted
        );

        this._router.get(AbonoRouter.PREFIX + "/:idAbono",
            jwtMiddleware.validateToken,
            abonoController.findById
        );

        this._router.put(AbonoRouter.PREFIX + "/:idAbono",
            jwtMiddleware.validateToken,
            abonoController.update
        );

        this._router.delete(AbonoRouter.PREFIX + "/:idAbono",
            jwtMiddleware.validateToken,
            abonoController.delete
        );
    }

    public getRouter = (): Router => {
        return this._router;
    };
}
