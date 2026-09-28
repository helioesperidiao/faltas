"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlunoRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const AlunoController_1 = require("../controllers/AlunoController");
const AlunoService_1 = require("../services/AlunoService");
const AlunoDAO_1 = require("../dao/AlunoDAO");
class AlunoRouter {
    static PREFIX = "/api/v1/alunos";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ AlunoRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const alunoDAO = new AlunoDAO_1.AlunoDAO(this._dataBase);
        const alunoService = new AlunoService_1.AlunoService(alunoDAO);
        const alunoController = new AlunoController_1.AlunoController(alunoService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(AlunoRouter.PREFIX + "/", jwtMiddleware.validateToken, alunoController.create);
        this._router.get(AlunoRouter.PREFIX + "/", jwtMiddleware.validateToken, alunoController.findAll);
        this._router.get(AlunoRouter.PREFIX + "/count", jwtMiddleware.validateToken, alunoController.count);
        this._router.get(AlunoRouter.PREFIX + "/deleted", jwtMiddleware.validateToken, alunoController.findAllDeleted);
        this._router.post(AlunoRouter.PREFIX + "/transicao-anual", jwtMiddleware.validateToken, alunoController.promoverTurma);
        this._router.get(AlunoRouter.PREFIX + "/matricula/:matricula", jwtMiddleware.validateToken, alunoController.findByMatricula);
        this._router.get(AlunoRouter.PREFIX + "/turma/:turma", jwtMiddleware.validateToken, alunoController.findByTurma);
        this._router.get(AlunoRouter.PREFIX + "/:idAluno", jwtMiddleware.validateToken, alunoController.findById);
        this._router.put(AlunoRouter.PREFIX + "/:idAluno", jwtMiddleware.validateToken, alunoController.update);
        this._router.delete(AlunoRouter.PREFIX + "/:idAluno", jwtMiddleware.validateToken, alunoController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.AlunoRouter = AlunoRouter;
//# sourceMappingURL=AlunoRouter.js.map