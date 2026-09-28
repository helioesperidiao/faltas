"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensaRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const UploadMiddleware_1 = require("../middlewares/UploadMiddleware");
const DispensaController_1 = require("../controllers/DispensaController");
const DispensaService_1 = require("../services/DispensaService");
const DispensaDAO_1 = require("../dao/DispensaDAO");
class DispensaRouter {
    static PREFIX = "/api/v1/dispensa";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ DispensaRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const dispensaDAO = new DispensaDAO_1.DispensaDAO(this._dataBase);
        const dispensaService = new DispensaService_1.DispensaService(dispensaDAO);
        const dispensaController = new DispensaController_1.DispensaController(dispensaService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(DispensaRouter.PREFIX + "/", jwtMiddleware.validateToken, dispensaController.create);
        this._router.post(DispensaRouter.PREFIX + "/:idDispensa/arquivo", jwtMiddleware.validateToken, UploadMiddleware_1.uploadDispensaMiddleware.single("arquivo"), dispensaController.uploadArquivo);
        this._router.get(DispensaRouter.PREFIX + "/", jwtMiddleware.validateToken, dispensaController.findAll);
        this._router.get(DispensaRouter.PREFIX + "/count", jwtMiddleware.validateToken, dispensaController.count);
        this._router.get(DispensaRouter.PREFIX + "/deleted", jwtMiddleware.validateToken, dispensaController.findAllDeleted);
        this._router.get(DispensaRouter.PREFIX + "/:idDispensa", jwtMiddleware.validateToken, dispensaController.findById);
        this._router.put(DispensaRouter.PREFIX + "/:idDispensa", jwtMiddleware.validateToken, dispensaController.update);
        this._router.delete(DispensaRouter.PREFIX + "/:idDispensa", jwtMiddleware.validateToken, dispensaController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.DispensaRouter = DispensaRouter;
//# sourceMappingURL=DispensaRouter.js.map