import { Request, Response } from "express";
import { DispensaService } from "../services/DispensaService";
import { BaseController } from "./BaseController";
export declare class DispensaController extends BaseController {
    private _dispensaService;
    constructor(dispensaServiceDependency: DispensaService);
    create: (request: Request, response: Response) => Promise<void>;
    uploadArquivo: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
    findAllDeleted: (request: Request, response: Response) => Promise<void>;
    findById: (_request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=DispensaController.d.ts.map