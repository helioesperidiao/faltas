import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { RelatorioController } from "../controllers/RelatorioController";
import { RelatorioService } from "../services/RelatorioService";
import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { ConfiguracaoAlertaFaltaDAO } from "../dao/ConfiguracaoAlertaFaltaDAO";
import { AlertaFaltaDAO } from "../dao/AlertaFaltaDAO";
import { MongoDatabase } from "../database/MongoDatabase";

export class RelatorioRouter {
    public static readonly PREFIX = "/api/v1/relatorios";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase) {
        console.log("⬆️ RelatorioRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        const alunoDAO = new AlunoDAO(this._dataBase);
        const registroDAO = new RegistroDAO(this._dataBase);
        const movimentacaoDAO = new MovimentacaoDAO(this._dataBase);
        const gradeHorarioDAO = new GradeHorarioDAO(this._dataBase);
        const relatorioService = new RelatorioService(
            alunoDAO,
            registroDAO,
            movimentacaoDAO,
            gradeHorarioDAO,
            new ConfiguracaoAlertaFaltaDAO(this._dataBase),
            new AlertaFaltaDAO(this._dataBase)
        );
        const relatorioController = new RelatorioController(relatorioService);
        const jwtMiddleware = new JwtMiddleware();

        this._router.get(RelatorioRouter.PREFIX + "/frequencia",
            jwtMiddleware.validateToken,
            relatorioController.frequenciaPorTurma
        );

        this._router.get(RelatorioRouter.PREFIX + "/faltas/periodo",
            jwtMiddleware.validateToken,
            relatorioController.faltasPorPeriodo
        );

        this._router.get(RelatorioRouter.PREFIX + "/faltas/semana",
            jwtMiddleware.validateToken,
            relatorioController.faltasPorSemana
        );

        this._router.get(RelatorioRouter.PREFIX + "/faltas/mes",
            jwtMiddleware.validateToken,
            relatorioController.faltasPorMes
        );

        this._router.get(RelatorioRouter.PREFIX + "/alertas-faltas-bimestral",
            jwtMiddleware.validateToken,
            relatorioController.alertasFaltaBimestral
        );

        this._router.get(RelatorioRouter.PREFIX + "/fechamento-dia",
            jwtMiddleware.validateToken,
            relatorioController.fechamentoDia
        );

        this._router.get(RelatorioRouter.PREFIX + "/fechamento-dia/pdf",
            jwtMiddleware.validateToken,
            relatorioController.fechamentoDiaPdf
        );
    }

    public getRouter = (): Router => {
        return this._router;
    };
}
