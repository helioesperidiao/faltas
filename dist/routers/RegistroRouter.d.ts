import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class RegistroRouter {
    static readonly PREFIX = "/api/v1/registro";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=RegistroRouter.d.ts.map