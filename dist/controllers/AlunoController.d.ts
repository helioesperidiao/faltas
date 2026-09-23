import { Request, Response } from "express";
import { AlunoService } from "../services/AlunoService";
import { BaseController } from "./BaseController";
export declare class AlunoController extends BaseController {
    private _alunoService;
    constructor(alunoServiceDependency: AlunoService);
    create: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
    findAllDeleted: (request: Request, response: Response) => Promise<void>;
    findById: (request: Request, response: Response) => Promise<void>;
    findByMatricula: (request: Request, response: Response) => Promise<void>;
    findByTurma: (request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=AlunoController.d.ts.map