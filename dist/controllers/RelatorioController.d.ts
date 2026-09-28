import { Request, Response } from "express";
import { RelatorioService } from "../services/RelatorioService";
import { BaseController } from "./BaseController";
export declare class RelatorioController extends BaseController {
    private _relatorioService;
    constructor(relatorioServiceDependency: RelatorioService);
    frequenciaPorTurma: (request: Request, response: Response) => Promise<void>;
    faltasPorPeriodo: (request: Request, response: Response) => Promise<void>;
    faltasPorSemana: (request: Request, response: Response) => Promise<void>;
    faltasPorMes: (request: Request, response: Response) => Promise<void>;
    alertasFaltaBimestral: (request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=RelatorioController.d.ts.map