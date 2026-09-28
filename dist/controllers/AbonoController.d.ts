import { Request, Response } from "express";
import { AbonoService } from "../services/AbonoService";
import { BaseController } from "./BaseController";
export declare class AbonoController extends BaseController {
    private _abonoService;
    constructor(abonoServiceDependency: AbonoService);
    create: (request: Request, response: Response) => Promise<void>;
    uploadArquivo: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
    findAllDeleted: (request: Request, response: Response) => Promise<void>;
    findById: (_request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    aprovar: (request: Request, response: Response) => Promise<void>;
    rejeitar: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=AbonoController.d.ts.map