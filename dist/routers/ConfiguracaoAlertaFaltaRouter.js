"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracaoAlertaFaltaRouter = void 0;
const express_1 = require("express");
const ConfiguracaoAlertaFaltaDAO_1 = require("@/dao/ConfiguracaoAlertaFaltaDAO");
const ConfiguracaoAlertaFaltaService_1 = require("@/services/ConfiguracaoAlertaFaltaService");
const ConfiguracaoAlertaFaltaController_1 = require("@/controllers/ConfiguracaoAlertaFaltaController");
const JwtMiddleware_1 = require("@/middlewares/JwtMiddleware");
class ConfiguracaoAlertaFaltaRouter {
    static PREFIX = "/api/v1/alertas-faltas/configuracoes";
    router;
    constructor(database) {
        this.router = (0, express_1.Router)();
        const controller = new ConfiguracaoAlertaFaltaController_1.ConfiguracaoAlertaFaltaController(new ConfiguracaoAlertaFaltaService_1.ConfiguracaoAlertaFaltaService(new ConfiguracaoAlertaFaltaDAO_1.ConfiguracaoAlertaFaltaDAO(database)));
        const jwt = new JwtMiddleware_1.JwtMiddleware();
        this.router.get(ConfiguracaoAlertaFaltaRouter.PREFIX, jwt.validateToken, controller.findAll);
        this.router.post(ConfiguracaoAlertaFaltaRouter.PREFIX, jwt.validateToken, controller.create);
        this.router.put(ConfiguracaoAlertaFaltaRouter.PREFIX + "/:idConfiguracao", jwt.validateToken, controller.update);
        this.router.delete(ConfiguracaoAlertaFaltaRouter.PREFIX + "/:idConfiguracao", jwt.validateToken, controller.delete);
    }
    getRouter = () => this.router;
}
exports.ConfiguracaoAlertaFaltaRouter = ConfiguracaoAlertaFaltaRouter;
//# sourceMappingURL=ConfiguracaoAlertaFaltaRouter.js.map