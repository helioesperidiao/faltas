import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class FuncionarioRouter {
    private _dataBase;
    static readonly PREFIX = "/api/v1/funcionarios";
    private _router;
    constructor(_dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=FuncionarioRouter.d.ts.map