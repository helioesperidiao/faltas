"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const RelatorioController_1 = require("../controllers/RelatorioController");
const RelatorioService_1 = require("../services/RelatorioService");
const AlunoDAO_1 = require("../dao/AlunoDAO");
const RegistroDAO_1 = require("../dao/RegistroDAO");
const GradeHorarioDAO_1 = require("../dao/GradeHorarioDAO");
const ConfiguracaoAlertaFaltaDAO_1 = require("../dao/ConfiguracaoAlertaFaltaDAO");
const AlertaFaltaDAO_1 = require("../dao/AlertaFaltaDAO");
class RelatorioRouter {
    static PREFIX = "/api/v1/relatorios";
    _router;
    _dataBase;
    constructor(dataBase) {
        console.log("⬆️ RelatorioRouter.constructor()");
        this._router = (0, express_1.Router)();
        this._dataBase = dataBase;
        const alunoDAO = new AlunoDAO_1.AlunoDAO(this._dataBase);
        const registroDAO = new RegistroDAO_1.RegistroDAO(this._dataBase);
        const gradeHorarioDAO = new GradeHorarioDAO_1.GradeHorarioDAO(this._dataBase);
        const relatorioService = new RelatorioService_1.RelatorioService(alunoDAO, registroDAO, gradeHorarioDAO, new ConfiguracaoAlertaFaltaDAO_1.ConfiguracaoAlertaFaltaDAO(this._dataBase), new AlertaFaltaDAO_1.AlertaFaltaDAO(this._dataBase));
        const relatorioController = new RelatorioController_1.RelatorioController(relatorioService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        this._router.get(RelatorioRouter.PREFIX + "/frequencia", jwtMiddleware.validateToken, relatorioController.frequenciaPorTurma);
        this._router.get(RelatorioRouter.PREFIX + "/faltas/periodo", jwtMiddleware.validateToken, relatorioController.faltasPorPeriodo);
        this._router.get(RelatorioRouter.PREFIX + "/faltas/semana", jwtMiddleware.validateToken, relatorioController.faltasPorSemana);
        this._router.get(RelatorioRouter.PREFIX + "/faltas/mes", jwtMiddleware.validateToken, relatorioController.faltasPorMes);
        this._router.get(RelatorioRouter.PREFIX + "/alertas-faltas-bimestral", jwtMiddleware.validateToken, relatorioController.alertasFaltaBimestral);
    }
    getRouter = () => {
        return this._router;
    };
}
exports.RelatorioRouter = RelatorioRouter;
//# sourceMappingURL=RelatorioRouter.js.map