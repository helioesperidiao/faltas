import { Request, Response } from "express";
import { CargoService } from "../services/CargoService";
import { BaseController } from "./BaseController";
export declare class CargoController extends BaseController {
    private _cargoService;
    constructor(cargoServiceDependency: CargoService);
    create: (request: Request, response: Response) => Promise<void>;
    findAll: (_request: Request, response: Response) => Promise<void>;
    findAllDeleted: (request: Request, response: Response) => Promise<void>;
    findById: (_request: Request, response: Response) => Promise<void>;
    update: (request: Request, response: Response) => Promise<void>;
    delete: (request: Request, response: Response) => Promise<void>;
    count: (_request: Request, response: Response) => Promise<void>;
}
//# sourceMappingURL=CargoController.d.ts.map