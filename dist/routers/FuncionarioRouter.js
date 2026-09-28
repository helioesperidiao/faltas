"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const FuncionarioController_1 = require("../controllers/FuncionarioController");
const FuncionarioService_1 = require("../services/FuncionarioService");
const FuncionarioDAO_1 = require("../dao/FuncionarioDAO");
const CargoDAO_1 = require("../dao/CargoDAO");
class FuncionarioRouter {
    _dataBase;
    static PREFIX = "/api/v1/funcionarios";
    _router;
    constructor(_dataBase) {
        this._dataBase = _dataBase;
        console.log("⬆️ FuncionarioRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = _dataBase;
        const funcionarioDAO = new FuncionarioDAO_1.FuncionarioDAO(this._dataBase);
        const cargoDAO = new CargoDAO_1.CargoDAO(this._dataBase);
        const funcionarioService = new FuncionarioService_1.FuncionarioService(funcionarioDAO, cargoDAO);
        const funcionarioController = new FuncionarioController_1.FuncionarioController(funcionarioService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(FuncionarioRouter.PREFIX + "/login", funcionarioController.login);
        this._router.post(FuncionarioRouter.PREFIX + "/", jwtMiddleware.validateToken, funcionarioController.create);
        this._router.get(FuncionarioRouter.PREFIX + "/", jwtMiddleware.validateToken, funcionarioController.findAll);
        this._router.get(FuncionarioRouter.PREFIX + "/count", jwtMiddleware.validateToken, funcionarioController.count);
        this._router.get(FuncionarioRouter.PREFIX + "/count/:idCargo", jwtMiddleware.validateToken, funcionarioController.countByCargoId);
        this._router.get(FuncionarioRouter.PREFIX + "/:idFuncionario", jwtMiddleware.validateToken, funcionarioController.findById);
        this._router.put(FuncionarioRouter.PREFIX + "/:idFuncionario", jwtMiddleware.validateToken, funcionarioController.update);
        this._router.delete(FuncionarioRouter.PREFIX + "/:idFuncionario", jwtMiddleware.validateToken, funcionarioController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.FuncionarioRouter = FuncionarioRouter;
//# sourceMappingURL=FuncionarioRouter.js.map