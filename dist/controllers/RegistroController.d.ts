import { Request, Response } from "express";
import { RegistroService } from "../services/RegistroService";
import { BaseController } from "./BaseController";
export declare class RegistroController extends BaseController {
    private _registroService;
    constructor(registroServiceDependency: RegistroService);
    create: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
    findAllDeleted: (request: Request, response: Response) => Promise<void>;
    findAusentesEntrada: (request: Request, response: Response) => Promise<void>;
    findById: (_request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=RegistroController.d.ts.map