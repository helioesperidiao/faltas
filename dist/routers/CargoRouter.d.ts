import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class CargoRouter {
    static readonly PREFIX = "/api/v1/cargos";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=CargoRouter.d.ts.map