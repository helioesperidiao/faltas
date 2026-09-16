"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const CargoRouter_1 = require("./routers/CargoRouter");
const FuncionarioRouter_1 = require("./routers/FuncionarioRouter");
const RegistroRouter_1 = require("./routers/RegistroRouter");
const DispensaRouter_1 = require("./routers/DispensaRouter");
const AbonoRouter_1 = require("./routers/AbonoRouter");
const AlunoRouter_1 = require("./routers/AlunoRouter");
const GradeHorarioRouter_1 = require("./routers/GradeHorarioRouter");
const RelatorioRouter_1 = require("./routers/RelatorioRouter");
const ConfiguracaoAlertaFaltaRouter_1 = require("./routers/ConfiguracaoAlertaFaltaRouter");
const ErrorResponse_1 = require("./http/ErrorResponse");
const StandardResponse_1 = require("./http/StandardResponse");
const MongoDatabase_1 = require("./database/MongoDatabase");
class Server {
    _porta;
    _app;
    _cargoRouter;
    _funcionarioRouter;
    _registroRouter;
    _dispensaRouter;
    _abonoRouter;
    _alunoRouter;
    _gradeHorarioRouter;
    _relatorioRouter;
    _configuracaoAlertaFaltaRouter;
    _dataBase;
    constructor(porta) {
        console.log("⬆️ Server.constructor()");
        this._dataBase = new MongoDatabase_1.MongoDatabase();
        this._porta = porta ?? 8080;
        this._app = (0, express_1.default)();
        this._cargoRouter = new CargoRouter_1.CargoRouter(this._dataBase);
        this._funcionarioRouter = new FuncionarioRouter_1.FuncionarioRouter(this._dataBase);
        this._registroRouter = new RegistroRouter_1.RegistroRouter(this._dataBase);
        this._dispensaRouter = new DispensaRouter_1.DispensaRouter(this._dataBase);
        this._abonoRouter = new AbonoRouter_1.AbonoRouter(this._dataBase);
        this._alunoRouter = new AlunoRouter_1.AlunoRouter(this._dataBase);
        this._gradeHorarioRouter = new GradeHorarioRouter_1.GradeHorarioRouter(this._dataBase);
        this._relatorioRouter = new RelatorioRouter_1.RelatorioRouter(this._dataBase);
        this._configuracaoAlertaFaltaRouter = new ConfiguracaoAlertaFaltaRouter_1.ConfiguracaoAlertaFaltaRouter(this._dataBase);
    }
    async init() {
        console.log("⬆️ Server.init()");
        await this._dataBase.initializeSchema();
        this._app.use((0, cors_1.default)({ origin: "*" }));
        this._app.use(express_1.default.json());
        this._app.use("/vendor/xlsx", express_1.default.static(path_1.default.resolve(__dirname, "../node_modules/xlsx/dist")));
        this._app.use(express_1.default.static(path_1.default.resolve(__dirname, "public")));
        this._app.use(this._cargoRouter.getRouter());
        this._app.use(this._funcionarioRouter.getRouter());
        this._app.use(this._registroRouter.getRouter());
        this._app.use(this._dispensaRouter.getRouter());
        this._app.use(this._abonoRouter.getRouter());
        this._app.use(this._alunoRouter.getRouter());
        this._app.use(this._gradeHorarioRouter.getRouter());
        this._app.use(this._relatorioRouter.getRouter());
        this._app.use(this._configuracaoAlertaFaltaRouter.getRouter());
        this.setupErrorMiddleware();
    }
    setupErrorMiddleware() {
        this._app.use((error, _req, res, _next) => {
            console.error("❌ Erro capturado:", error);
            if (error instanceof ErrorResponse_1.ErrorResponse) {
                return StandardResponse_1.StandardResponse.error(error.message, error.error, error.httpCode).send(res);
            }
            return StandardResponse_1.StandardResponse.internalError("Erro interno do servidor", {
                message: error.message || "Erro interno"
            }).send(res);
        });
    }
    run() {
        this._app.listen(this._porta)
            .on('error', (err) => {
            console.error(`❌ Erro ao iniciar servidor na porta ${this._porta}:`, err);
            process.exit(1);
        })
            .on('listening', () => {
            console.log(`🚀 Server rodando em http://localhost:8080/faltas/Login.html`);
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map