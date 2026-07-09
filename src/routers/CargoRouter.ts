import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { CargoMiddleware } from "../middlewares/CargoMiddleware";
import { CargoController } from "../controllers/CargoController";
import { CargoService } from "../services/CargoService";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class CargoRouter {
    public static readonly PREFIX = "/api/v1/cargos";
    private _router: Router;

    constructor() {
        console.log("⬆️ CargoRouter.constructor()");
        this._router = Router();

        const mongoDB = new MongoDatabase();
        const cargoDAO = new CargoDAO(mongoDB);
        const cargoService = new CargoService(cargoDAO);
        const cargoController = new CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware();
        const cargoMiddleware = new CargoMiddleware();

        // Rotas com prefixo /api/cargos
        this._router.post("/",
            jwtMiddleware.validateToken,
            cargoMiddleware.validateBody,
            cargoController.create
        );
        this._router.get("/",
            jwtMiddleware.validateToken,
            cargoController.findAll
        );
        this._router.get("/:idCargo",
            jwtMiddleware.validateToken,
            cargoMiddleware.validateIdParam,
            cargoController.findById
        );
        this._router.put("/:idCargo",
            jwtMiddleware.validateToken,
            cargoMiddleware.validateIdParam,
            cargoMiddleware.validateBody,
            cargoController.update
        );
        this._router.delete("/:idCargo",
            jwtMiddleware.validateToken,
            cargoMiddleware.validateIdParam,
            cargoController.delete
        );
    }

    getRouter(): Router {
        return this._router;
    }
}