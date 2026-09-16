import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class DispensaRouter {
    static readonly PREFIX = "/api/v1/dispensa";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=DispensaRouter.d.ts.map