import { Request, Response } from "express";
import { GradeHorarioService } from "../services/GradeHorarioService";
import { BaseController } from "./BaseController";
export declare class GradeHorarioController extends BaseController {
    private _gradeHorarioService;
    constructor(gradeHorarioServiceDependency: GradeHorarioService);
    create: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
    findAllDeleted: (request: Request, response: Response) => Promise<void>;
    findById: (request: Request, response: Response) => Promise<void>;
    findByTurma: (request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=GradeHorarioController.d.ts.map