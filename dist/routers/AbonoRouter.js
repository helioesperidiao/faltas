"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbonoRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const UploadMiddleware_1 = require("../middlewares/UploadMiddleware");
const AbonoController_1 = require("../controllers/AbonoController");
const AbonoService_1 = require("../services/AbonoService");
const AbonoDAO_1 = require("../dao/AbonoDAO");
const RegistroDAO_1 = require("../dao/RegistroDAO");
const AlunoDAO_1 = require("../dao/AlunoDAO");
class AbonoRouter {
    static PREFIX = "/api/v1/abonos";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ AbonoRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const abonoDAO = new AbonoDAO_1.AbonoDAO(this._dataBase);
        const registroDAO = new RegistroDAO_1.RegistroDAO(this._dataBase);
        const alunoDAO = new AlunoDAO_1.AlunoDAO(this._dataBase);
        const abonoService = new AbonoService_1.AbonoService(abonoDAO, registroDAO, alunoDAO);
        const abonoController = new AbonoController_1.AbonoController(abonoService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(AbonoRouter.PREFIX + "/", jwtMiddleware.validateToken, abonoController.create);
        this._router.post(AbonoRouter.PREFIX + "/:idAbono/arquivo", jwtMiddleware.validateToken, UploadMiddleware_1.uploadAbonoMiddleware.single("arquivo"), abonoController.uploadArquivo);
        this._router.put(AbonoRouter.PREFIX + "/:idAbono/aprovar", jwtMiddleware.validateToken, abonoController.aprovar);
        this._router.put(AbonoRouter.PREFIX + "/:idAbono/rejeitar", jwtMiddleware.validateToken, abonoController.rejeitar);
        this._router.get(AbonoRouter.PREFIX + "/", jwtMiddleware.validateToken, abonoController.findAll);
        this._router.get(AbonoRouter.PREFIX + "/count", jwtMiddleware.validateToken, abonoController.count);
        this._router.get(AbonoRouter.PREFIX + "/deleted", jwtMiddleware.validateToken, abonoController.findAllDeleted);
        this._router.get(AbonoRouter.PREFIX + "/:idAbono", jwtMiddleware.validateToken, abonoController.findById);
        this._router.put(AbonoRouter.PREFIX + "/:idAbono", jwtMiddleware.validateToken, abonoController.update);
        this._router.delete(AbonoRouter.PREFIX + "/:idAbono", jwtMiddleware.validateToken, abonoController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.AbonoRouter = AbonoRouter;
//# sourceMappingURL=AbonoRouter.js.map