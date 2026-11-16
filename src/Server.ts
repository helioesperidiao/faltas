import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";

import { CargoRouter } from "./routers/CargoRouter";
import { FuncionarioRouter } from "./routers/FuncionarioRouter";
import { RegistroRouter } from "./routers/RegistroRouter";
import { DispensaRouter } from "./routers/DispensaRouter";
import { AbonoRouter } from "./routers/AbonoRouter";
import { AlunoRouter } from "./routers/AlunoRouter";
import { GradeHorarioRouter } from "./routers/GradeHorarioRouter";
import { RelatorioRouter } from "./routers/RelatorioRouter";
import { MovimentacaoRouter } from "./routers/MovimentacaoRouter";
import { ImportacaoRouter } from "./routers/ImportacaoRouter";
import { ConfiguracaoAlertaFaltaRouter } from "./routers/ConfiguracaoAlertaFaltaRouter";
import { ErrorResponse } from "./http/ErrorResponse";
import { StandardResponse } from "./http/StandardResponse";
import { MongoDatabase } from "./database/MongoDatabase";
// NOVO: logger e middleware HTTP (padrão de logs)
import { httpLogger } from "./logging/HttpLogger";
import { createLogger } from "./logging/Logger";

const log = createLogger("Server");

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
    private _movimentacaoRouter: MovimentacaoRouter;
    private _importacaoRouter: ImportacaoRouter;
    private _configuracaoAlertaFaltaRouter: ConfiguracaoAlertaFaltaRouter;
    private _dataBase: MongoDatabase;

    constructor(porta?: number) {
        log.debug("constructor()");
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
        this._movimentacaoRouter = new MovimentacaoRouter(this._dataBase);
        this._importacaoRouter = new ImportacaoRouter();
        this._configuracaoAlertaFaltaRouter = new ConfiguracaoAlertaFaltaRouter(this._dataBase);
    }

    async init(): Promise<void> {
        log.debug("init()");

        await this._dataBase.initializeSchema();
        await this._funcionarioRouter.getService().initializeDefaultAdmin();

        // Middleware de log HTTP — deve vir primeiro entre os middlewares
        // para abrir o contexto (requestId) antes de qualquer outro processamento.
        this._app.use(httpLogger);
        this._app.use(cors({ origin: "*" }));
       
        this._app.use(express.json({ limit: "10mb" }));

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
        this._app.use(this._movimentacaoRouter.getRouter());
        this._app.use(this._importacaoRouter.getRouter());
        this._app.use(this._configuracaoAlertaFaltaRouter.getRouter());
        this.setupErrorMiddleware();

        log.debug("init() - middlewares e rotas registrados");
    }

    private setupErrorMiddleware(): void {
        this._app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
            // Payload grande demais (body-parser / raw-body)
            if (error?.type === "entity.too.large" || error?.name === "PayloadTooLargeError") {
                log.warn("payload too large", {
                    limit: error.limit,
                    length: error.length,
                });
                return StandardResponse.error(
                    "Payload too large",
                    { message: "O arquivo/envio excede o tamanho máximo permitido." },
                    413
                ).send(res);
            }

            if (error instanceof ErrorResponse) {
                log.warn("erro de negócio", {
                    httpCode: error.httpCode,
                    message: error.message,
                    details: error.error,
                });
                return StandardResponse.error(error.message, error.error, error.httpCode).send(res);
            }

            // Arquivo enviado fora das regras do upload (tamanho, campo ou tipo).
            if (error instanceof multer.MulterError) {
                const httpCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? "O arquivo excede o tamanho máximo permitido."
                    : "Arquivo enviado de forma inválida.";
                log.warn("upload recusado", { code: error.code, field: error.field });
                return StandardResponse.error(message, { code: error.code }, httpCode).send(res);
            }

            // Identificador que não é um ObjectId válido.
            if (error?.name === "BSONError") {
                log.warn("identificador inválido", { message: error.message });
                return StandardResponse.error("Identificador inválido.", { message: error.message }, 400).send(res);
            }

            // Erros do próprio Express/body-parser que já trazem um status 4xx,
            // como JSON malformado (entity.parse.failed).
            const statusCliente = Number(error?.status ?? error?.statusCode);
            if (statusCliente >= 400 && statusCliente < 500) {
                log.warn("requisição inválida", { status: statusCliente, type: error?.type });
                const message = error?.type === "entity.parse.failed"
                    ? "O corpo da requisição não é um JSON válido."
                    : "Requisição inválida.";
                return StandardResponse.error(message, null, statusCliente).send(res);
            }

            log.error("erro não tratado", {
                message: error?.message,
                stack: error?.stack,
            });

            return StandardResponse.internalError("Erro interno do servidor", {
                message: error.message || "Erro interno"
            }).send(res);
        });
    }

    run(): void {
        this._app.listen(this._porta)
            .on('error', (err) => {
                log.error(`falha ao escutar na porta ${this._porta}`, { error: err });
                process.exit(1);
            })
            .on('listening', () => {
                //console.log(`🚀 Server rodando em http://localhost:8080/faltas/Login.html`);
                log.info(`servidor ouvindo em http://localhost:${this._porta}/Login.html`);
            });
    }
}