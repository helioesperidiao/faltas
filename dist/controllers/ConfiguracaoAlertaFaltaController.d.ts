import { Request, Response } from "express";
import { ConfiguracaoAlertaFaltaService } from "@/services/ConfiguracaoAlertaFaltaService";
import { BaseController } from "./BaseController";
export declare class ConfiguracaoAlertaFaltaController extends BaseController {
    private readonly service;
    constructor(service: ConfiguracaoAlertaFaltaService);
    findAll: (request: Request, response: Response) => Promise<void>;
    create: (request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=ConfiguracaoAlertaFaltaController.d.ts.map