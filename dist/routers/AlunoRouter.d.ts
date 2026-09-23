import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class AlunoRouter {
    static readonly PREFIX = "/api/v1/alunos";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=AlunoRouter.d.ts.map