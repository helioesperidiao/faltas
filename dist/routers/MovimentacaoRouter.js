"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const MovimentacaoController_1 = require("../controllers/MovimentacaoController");
const MovimentacaoService_1 = require("../services/MovimentacaoService");
const MovimentacaoDAO_1 = require("../dao/MovimentacaoDAO");
class MovimentacaoRouter {
    static PREFIX = "/api/v1/movimentacoes";
    router;
    constructor(database) {
        this.router = (0, express_1.Router)();
        const controller = new MovimentacaoController_1.MovimentacaoController(new MovimentacaoService_1.MovimentacaoService(new MovimentacaoDAO_1.MovimentacaoDAO(database)));
        const jwt = new JwtMiddleware_1.JwtMiddleware();
        this.router.post(MovimentacaoRouter.PREFIX + "/", jwt.validateToken, controller.create);
        this.router.get(MovimentacaoRouter.PREFIX + "/", jwt.validateToken, controller.findAll);
    }
    getRouter = () => this.router;
}
exports.MovimentacaoRouter = MovimentacaoRouter;
//# sourceMappingURL=MovimentacaoRouter.js.map