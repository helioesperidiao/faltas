import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class AbonoRouter {
    static readonly PREFIX = "/api/v1/abonos";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=AbonoRouter.d.ts.map