import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import { CargoRouter } from "./routers/CargoRouter";
import { FuncionarioRouter } from "./routers/FuncionarioRouter";
import { RegistroRouter } from "./routers/RegistroRouter";
import { DispensaRouter } from "./routers/DispensaRouter";
import { AbonoRouter } from "./routers/AbonoRouter";
import { AlunoRouter } from "./routers/AlunoRouter";
import { GradeHorarioRouter } from "./routers/GradeHorarioRouter";
import { RelatorioRouter } from "./routers/RelatorioRouter";
<<<<<<< HEAD
import { MovimentacaoRouter } from "./routers/MovimentacaoRouter";
=======
import { ConfiguracaoAlertaFaltaRouter } from "./routers/ConfiguracaoAlertaFaltaRouter";
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
import { ErrorResponse } from "./http/ErrorResponse";
import { StandardResponse } from "./http/StandardResponse";
import { MongoDatabase } from "./database/MongoDatabase";

export class Server {
    private _porta: number;
    private _app: Express;

    private _cargoRouter: CargoRouter;
    private _funcionarioRouter: FuncionarioRouter;
    private _registroRouter: RegistroRouter;
    private _dispensaRouter: DispensaRouter;
    private _abonoRouter: AbonoRouter;
    private _alunoRouter: AlunoRouter;
    private _gradeHorarioRouter: GradeHorarioRouter;
    private _relatorioRouter: RelatorioRouter;
<<<<<<< HEAD
    private _movimentacaoRouter: MovimentacaoRouter;
=======
    private _configuracaoAlertaFaltaRouter: ConfiguracaoAlertaFaltaRouter;
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
    private _dataBase: MongoDatabase;

    constructor(porta?: number) {
        console.log("⬆️ Server.constructor()");
        this._dataBase = new MongoDatabase();

        this._porta = porta ?? 8080;
        this._app = express();

        this._cargoRouter = new CargoRouter(this._dataBase);
        this._funcionarioRouter = new FuncionarioRouter(this._dataBase);
        this._registroRouter = new RegistroRouter(this._dataBase);
        this._dispensaRouter = new DispensaRouter(this._dataBase);
        this._abonoRouter = new AbonoRouter(this._dataBase);
        this._alunoRouter = new AlunoRouter(this._dataBase);
        this._gradeHorarioRouter = new GradeHorarioRouter(this._dataBase);
        this._relatorioRouter = new RelatorioRouter(this._dataBase);
<<<<<<< HEAD
        this._movimentacaoRouter = new MovimentacaoRouter(this._dataBase);
=======
        this._configuracaoAlertaFaltaRouter = new ConfiguracaoAlertaFaltaRouter(this._dataBase);
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
    }

    async init(): Promise<void> {
        console.log("⬆️ Server.init()");

        await this._dataBase.initializeSchema();

        this._app.use(cors({ origin: "*" }));
        this._app.use(express.json());
        this._app.use("/vendor/xlsx", express.static(path.resolve(__dirname, "../node_modules/xlsx/dist")));
        // Tabelas completas de codificação para planilhas legadas (.xls/CSV),
        // incluindo Windows-1252, usual em arquivos brasileiros.
        this._app.use("/vendor/codepage", express.static(path.resolve(__dirname, "../node_modules/codepage/dist")));
        this._app.use(express.static(path.resolve(__dirname, "public")));

        // Rotas da API (os routers já têm seus prefixos internos)
        this._app.use(this._cargoRouter.getRouter());
        this._app.use(this._funcionarioRouter.getRouter());
        this._app.use(this._registroRouter.getRouter());
        this._app.use(this._dispensaRouter.getRouter());
        this._app.use(this._abonoRouter.getRouter());
        this._app.use(this._alunoRouter.getRouter());
        this._app.use(this._gradeHorarioRouter.getRouter());
        this._app.use(this._relatorioRouter.getRouter());
<<<<<<< HEAD
        this._app.use(this._movimentacaoRouter.getRouter());


=======
        this._app.use(this._configuracaoAlertaFaltaRouter.getRouter());
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037
        this.setupErrorMiddleware();
    }

    private setupErrorMiddleware(): void {
        this._app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
            console.error("❌ Erro capturado:", error);

            // Se for um erro personalizado (ErrorResponse), usa seus dados
            if (error instanceof ErrorResponse) {
                return StandardResponse.error(error.message, error.error, error.httpCode).send(res);
            }

            // Erro genérico (não tratado)
            return StandardResponse.internalError("Erro interno do servidor", {
                message: error.message || "Erro interno"
            }).send(res);
        });
    }

    run(): void {
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
