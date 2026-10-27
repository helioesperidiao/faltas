import { Request, Response } from "express";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { BaseController } from "./BaseController";
export declare class MovimentacaoController extends BaseController {
    private readonly movimentacaoService;
    constructor(movimentacaoService: MovimentacaoService);
    private montarMovimentacao;
    create: (request: Request, response: Response) => Promise<void>;
    createLote: (request: Request, response: Response) => Promise<void>;
    findAll: (request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=MovimentacaoController.d.ts.map