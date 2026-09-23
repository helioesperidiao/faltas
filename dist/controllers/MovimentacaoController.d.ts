import { Request, Response } from "express";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { BaseController } from "./BaseController";
export declare class MovimentacaoController extends BaseController {
    private readonly movimentacaoService;
    constructor(movimentacaoService: MovimentacaoService);
    create: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=MovimentacaoController.d.ts.map