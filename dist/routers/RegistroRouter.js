"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistroRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const RegistroController_1 = require("../controllers/RegistroController");
const RegistroService_1 = require("../services/RegistroService");
const RegistroDAO_1 = require("../dao/RegistroDAO");
const AlunoDAO_1 = require("../dao/AlunoDAO");
class RegistroRouter {
    static PREFIX = "/api/v1/registro";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ RegistroRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const registroDAO = new RegistroDAO_1.RegistroDAO(this._dataBase);
        const alunoDAO = new AlunoDAO_1.AlunoDAO(this._dataBase);
        const registroService = new RegistroService_1.RegistroService(registroDAO, alunoDAO);
        const registroController = new RegistroController_1.RegistroController(registroService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(RegistroRouter.PREFIX + "/", jwtMiddleware.validateToken, registroController.create);
        this._router.get(RegistroRouter.PREFIX + "/", jwtMiddleware.validateToken, registroController.findAll);
        this._router.get(RegistroRouter.PREFIX + "/count", jwtMiddleware.validateToken, registroController.count);
        this._router.get(RegistroRouter.PREFIX + "/deleted", jwtMiddleware.validateToken, registroController.findAllDeleted);
        this._router.get(RegistroRouter.PREFIX + "/ausentes-entrada", jwtMiddleware.validateToken, registroController.findAusentesEntrada);
        this._router.get(RegistroRouter.PREFIX + "/chamada", jwtMiddleware.validateToken, registroController.findChamadaPorTurmaEDia);
        this._router.get(RegistroRouter.PREFIX + "/:idRegistro", jwtMiddleware.validateToken, registroController.findById);
        this._router.put(RegistroRouter.PREFIX + "/:idRegistro", jwtMiddleware.validateToken, registroController.update);
        this._router.delete(RegistroRouter.PREFIX + "/:idRegistro", jwtMiddleware.validateToken, registroController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.RegistroRouter = RegistroRouter;
//# sourceMappingURL=RegistroRouter.js.map