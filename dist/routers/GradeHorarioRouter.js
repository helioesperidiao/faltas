"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeHorarioRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const GradeHorarioController_1 = require("../controllers/GradeHorarioController");
const GradeHorarioService_1 = require("../services/GradeHorarioService");
const GradeHorarioDAO_1 = require("../dao/GradeHorarioDAO");
class GradeHorarioRouter {
    static PREFIX = "/api/v1/gradehorarios";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ GradeHorarioRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const gradeHorarioDAO = new GradeHorarioDAO_1.GradeHorarioDAO(this._dataBase);
        const gradeHorarioService = new GradeHorarioService_1.GradeHorarioService(gradeHorarioDAO);
        const gradeHorarioController = new GradeHorarioController_1.GradeHorarioController(gradeHorarioService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.post(GradeHorarioRouter.PREFIX + "/", jwtMiddleware.validateToken, gradeHorarioController.create);
        this._router.get(GradeHorarioRouter.PREFIX + "/", jwtMiddleware.validateToken, gradeHorarioController.findAll);
        this._router.get(GradeHorarioRouter.PREFIX + "/count", jwtMiddleware.validateToken, gradeHorarioController.count);
        this._router.get(GradeHorarioRouter.PREFIX + "/deleted", jwtMiddleware.validateToken, gradeHorarioController.findAllDeleted);
        this._router.get(GradeHorarioRouter.PREFIX + "/turma/:turma", jwtMiddleware.validateToken, gradeHorarioController.findByTurma);
        this._router.get(GradeHorarioRouter.PREFIX + "/:idGradeHorario", jwtMiddleware.validateToken, gradeHorarioController.findById);
        this._router.put(GradeHorarioRouter.PREFIX + "/:idGradeHorario", jwtMiddleware.validateToken, gradeHorarioController.update);
        this._router.delete(GradeHorarioRouter.PREFIX + "/:idGradeHorario", jwtMiddleware.validateToken, gradeHorarioController.delete);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.GradeHorarioRouter = GradeHorarioRouter;
//# sourceMappingURL=GradeHorarioRouter.js.map