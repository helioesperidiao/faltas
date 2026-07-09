import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import { CargoRouter } from "./routers/CargoRouter";
import { FuncionarioRouter } from "./routers/FuncionarioRouter";
import { ErrorResponse } from "./http/ErrorResponse";

export class Server {
    private _porta: number;
    private _app: Express;
   
    private _cargoRouter: CargoRouter;
    private _funcionarioRouter: FuncionarioRouter;

    constructor(porta?: number) {
        console.log("⬆️ Server.constructor()");
        this._porta = porta ?? 8080;
        this._app = express();

        this._cargoRouter = new CargoRouter();
        this._funcionarioRouter = new FuncionarioRouter();
    }

    async init(): Promise<void> {
        console.log("⬆️ Server.init()");

        this._app.use(cors({ origin: "*" }));
        this._app.use(express.json());  
        this._app.use(express.static(path.resolve(__dirname, "public")));  

        //await this._mongoDB.connect();

        // Rotas da API (os routers já têm seus prefixos internos)
        this._app.use(CargoRouter.PREFIX, this._cargoRouter.getRouter());
        this._app.use(FuncionarioRouter.PREFIX, this._funcionarioRouter.getRouter());

   

        this.setupErrorMiddleware();
    }

    private setupErrorMiddleware(): void {
        this._app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
            if (error instanceof ErrorResponse) {
                return res.status(error.httpCode).json({
                    success: false,
                    message: error.message,
                    error: error.error
                });
            }
            console.error("❌ Erro capturado:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor",
                error: { message: error.message || "Erro interno" }
            });
        });
    }

    run(): void {
        this._app.listen(this._porta)
            .on('error', (err) => {
                console.error(`❌ Erro ao iniciar servidor na porta ${this._porta}:`, err);
                process.exit(1);
            })
            .on('listening', () => {
                console.log(`🚀 Server rodando em http://localhost:${this._porta}/Login.html`);
                console.log(`📄 Acesse também http://localhost:${this._porta}/`);
            });
    }
}