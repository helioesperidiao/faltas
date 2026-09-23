import { Request, Response } from "express";
import { FuncionarioService } from "../services/FuncionarioService";
import { BaseController } from "./BaseController";
export declare class FuncionarioController extends BaseController {
    private _funcionarioService;
    constructor(funcionarioServiceDependency: FuncionarioService);
    login: (request: Request, response: Response) => Promise<void>;
    create: (request: Request, response: Response) => Promise<void>;
    findAll: (request: Request, response: Response) => Promise<void>;
    findById: (request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (request: Request, response: Response) => Promise<void>;
    countByCargoId: (request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=FuncionarioController.d.ts.map