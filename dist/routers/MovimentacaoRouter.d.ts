import { Router } from "express";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class MovimentacaoRouter {
    static readonly PREFIX = "/api/v1/movimentacoes";
    private readonly router;
    constructor(database: MongoDatabase);
    getRouter: () => Router;
}
//# sourceMappingURL=MovimentacaoRouter.d.ts.map