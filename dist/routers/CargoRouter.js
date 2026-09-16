"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const CargoController_1 = require("../controllers/CargoController");
const CargoService_1 = require("../services/CargoService");
const CargoDAO_1 = require("../dao/CargoDAO");
class CargoRouter {
    static PREFIX = "/api/v1/cargos";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ CargoRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const cargoDAO = new CargoDAO_1.CargoDAO(this._dataBase);
        const cargoService = new CargoService_1.CargoService(cargoDAO);
        const cargoController = new CargoController_1.CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(CargoRouter.PREFIX + "/", jwtMiddleware.validateToken, cargoController.create);
        this._router.get(CargoRouter.PREFIX + "/", jwtMiddleware.validateToken, cargoController.findAll);
        this._router.get(CargoRouter.PREFIX + "/count", jwtMiddleware.validateToken, cargoController.count);
        this._router.get(CargoRouter.PREFIX + "/deleted", jwtMiddleware.validateToken, cargoController.findAllDeleted);
        this._router.get(CargoRouter.PREFIX + "/:idCargo", jwtMiddleware.validateToken, cargoController.findById);
        this._router.put(CargoRouter.PREFIX + "/:idCargo", jwtMiddleware.validateToken, cargoController.update);
        this._router.delete(CargoRouter.PREFIX + "/:idCargo", jwtMiddleware.validateToken, cargoController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.CargoRouter = CargoRouter;
//# sourceMappingURL=CargoRouter.js.map