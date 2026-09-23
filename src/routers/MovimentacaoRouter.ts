import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { MovimentacaoController } from "../controllers/MovimentacaoController";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class MovimentacaoRouter {
    static readonly PREFIX = "/api/v1/movimentacoes";
    private readonly router: Router;

    constructor(database: MongoDatabase) {
        this.router = Router();
        const controller = new MovimentacaoController(new MovimentacaoService(new MovimentacaoDAO(database)));
        const jwt = new JwtMiddleware();
        this.router.post(MovimentacaoRouter.PREFIX + "/", jwt.validateToken, controller.create);
        this.router.get(MovimentacaoRouter.PREFIX + "/", jwt.validateToken, controller.findAll);
    }

    getRouter = (): Router => this.router;
}
