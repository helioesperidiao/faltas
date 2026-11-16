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
import { DispensaDAO } from "../dao/DispensaDAO";
import { MongoDatabase } from "../database/MongoDatabase";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";
// NOVO: asyncHandler (obrigatório — RelatorioController é async)
import { asyncHandler } from "../http/asyncHandler";

const log = createLogger("RelatorioRouter");

/**
 * Router responsável por expor os endpoints de relatório.
 *
 * Todos os endpoints são GET (consultas) e recebem parâmetros via querystring
 * (turma, dia, ano, mes, bimestre, dataInicio, dataFim).
 *
 * Recebe a instância de MongoDatabase por injeção para reaproveitar a
 * conexão singleton já aberta pelo Server.
 */
export class RelatorioRouter {
    public static readonly PREFIX = "/api/v1/relatorios";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase) {
        log.debug("constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        // Monta a cadeia DAO → Service → Controller com a conexão compartilhada.
        // O RelatorioService agrega 7 DAOs: ele precisa ler alunos, registros,
        // movimentações, grade de horários, configurações de alerta, a própria
        // coleção de alertas sincronizados e as dispensas por disciplina.
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
            new AlertaFaltaDAO(this._dataBase),
            new DispensaDAO(this._dataBase)
        );
        const relatorioController = new RelatorioController(relatorioService);
        const jwtMiddleware = new JwtMiddleware();

        // ⚠️ Todas as rotas passam por `asyncHandler`. Sem ele, os `throw` dentro
        // do controller (que é async) NÃO chegam ao `setupErrorMiddleware` do
        // Server.ts — e o cliente vê timeout ou 500 genérico do Express em vez
        // de um `StandardResponse` com `message`/`error`.
        this._router.get(
            RelatorioRouter.PREFIX + "/frequencia",
            jwtMiddleware.validateToken,
            asyncHandler(relatorioController.frequenciaPorTurma)
        );

        this._router.get(
            RelatorioRouter.PREFIX + "/faltas/periodo",
            jwtMiddleware.validateToken,
            asyncHandler(relatorioController.faltasPorPeriodo)
        );

        this._router.get(
            RelatorioRouter.PREFIX + "/faltas/semana",
            jwtMiddleware.validateToken,
            asyncHandler(relatorioController.faltasPorSemana)
        );

        this._router.get(
            RelatorioRouter.PREFIX + "/faltas/mes",
            jwtMiddleware.validateToken,
            asyncHandler(relatorioController.faltasPorMes)
        );

        this._router.get(
            RelatorioRouter.PREFIX + "/alertas-faltas-bimestral",
            jwtMiddleware.validateToken,
            asyncHandler(relatorioController.alertasFaltaBimestral)
        );

        this._router.get(RelatorioRouter.PREFIX + "/fechamento-dia",
            jwtMiddleware.validateToken,
            asyncHandler(relatorioController.fechamentoDia)
        );

    }

    public getRouter = (): Router => {
        return this._router;
    };
}
