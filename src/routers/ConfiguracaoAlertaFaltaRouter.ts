import { Router } from "express";
import { MongoDatabase } from "@/database/MongoDatabase";
import { ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { ConfiguracaoAlertaFaltaService } from "@/services/ConfiguracaoAlertaFaltaService";
import { ConfiguracaoAlertaFaltaController } from "@/controllers/ConfiguracaoAlertaFaltaController";
import { JwtMiddleware } from "@/middlewares/JwtMiddleware";

export class ConfiguracaoAlertaFaltaRouter {
    public static readonly PREFIX = "/api/v1/alertas-faltas/configuracoes";
    private readonly router: Router;

    constructor(database: MongoDatabase) {
        this.router = Router();
        const controller = new ConfiguracaoAlertaFaltaController(
            new ConfiguracaoAlertaFaltaService(new ConfiguracaoAlertaFaltaDAO(database))
        );
        const jwt = new JwtMiddleware();
        this.router.get(ConfiguracaoAlertaFaltaRouter.PREFIX, jwt.validateToken, controller.findAll);
        this.router.post(ConfiguracaoAlertaFaltaRouter.PREFIX, jwt.validateToken, controller.create);
        this.router.put(ConfiguracaoAlertaFaltaRouter.PREFIX + "/:idConfiguracao", jwt.validateToken, controller.update);
        this.router.delete(ConfiguracaoAlertaFaltaRouter.PREFIX + "/:idConfiguracao", jwt.validateToken, controller.delete);
    }

    public getRouter = (): Router => this.router;
}
