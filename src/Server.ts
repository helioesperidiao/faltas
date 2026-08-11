import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import { CargoRouter } from "./routers/CargoRouter";
import { FuncionarioRouter } from "./routers/FuncionarioRouter";
import { RegistroRouter } from "./routers/RegistroRouter";
import { DispensaRouter } from "./routers/DispensaRouter";
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
    }

    async init(): Promise<void> {
        console.log("⬆️ Server.init()");


        this._app.use(cors({ origin: "*" }));
        this._app.use(express.json());
        this._app.use(express.static(path.resolve(__dirname, "public")));

        // Rotas da API (os routers já têm seus prefixos internos)
        this._app.use(this._cargoRouter.getRouter());
        this._app.use(this._funcionarioRouter.getRouter());
        this._app.use(this._registroRouter.getRouter());
        this._app.use(this._dispensaRouter.getRouter());


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