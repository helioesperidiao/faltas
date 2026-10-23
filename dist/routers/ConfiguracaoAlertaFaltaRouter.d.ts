import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase.js";
export declare class ConfiguracaoAlertaFaltaRouter {
    static readonly PREFIX = "/api/v1/alertas-faltas/configuracoes";
    private readonly router;
    constructor(database: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=ConfiguracaoAlertaFaltaRouter.d.ts.map