import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class GradeHorarioRouter {
    static readonly PREFIX = "/api/v1/gradehorarios";
    private _router;
    private _dataBase;
    constructor(dataBase: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=GradeHorarioRouter.d.ts.map