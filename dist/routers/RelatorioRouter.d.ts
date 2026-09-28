import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class RelatorioRouter {
    static readonly PREFIX = "/api/v1/relatorios";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=RelatorioRouter.d.ts.map