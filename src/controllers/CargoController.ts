import { Request, Response } from "express";
import { CargoService } from "../services/CargoService";
import { Cargo } from "@/models/Cargo";
import { StandardResponse } from "@/http/StandardResponse"; // ajuste o caminho conforme sua estrutura

export class CargoController {
    private _cargoService: CargoService;

    constructor(cargoServiceDependency: CargoService) {
        console.log("⬆️  CargoController.constructor()");
        this._cargoService = cargoServiceDependency;
    }

    create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.create()");

        const novoCargo = new Cargo();
        novoCargo.nomeCargo = request.body.cargo.nomeCargo;

        const novoId = await this._cargoService.createCargo(novoCargo);

        // O service já deve ter preenchido o idCargo na instância, mas caso não, pegamos o retorno
        if (!novoId) {
            StandardResponse.error("Falha ao cadastrar novo Cargo", null, 500).send(response);
            return;
        }

        StandardResponse.created("Cadastro realizado com sucesso", {
            cargos: [{
                idCargo: novoCargo.idCargo,
                nomeCargo: novoCargo.nomeCargo
            }]
        }).send(response);
    };

    findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.findAll()");

        const arrayCargos = await this._cargoService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            cargos: arrayCargos
        }).send(response);
    };

    findById = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.findById()");

        const cargoId = request.params.idCargo.toString();
        const cargo = await this._cargoService.findById(cargoId);

        StandardResponse.success("Executado com sucesso", {
            cargos: cargo
        }).send(response);
    };

    update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.update()");

        const cargoId = request.params.idCargo.toString();
        const nomeCargo = request.body.cargo.nomeCargo;

        const cargo = new Cargo();
        cargo.idCargo = cargoId;
        cargo.nomeCargo = nomeCargo;

        const atualizou = await this._cargoService.updateCargo(cargo);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                cargos: [{
                    idCargo: cargoId,
                    nomeCargo: nomeCargo
                }]
            }).send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para atualização", {
                cargos: [{
                    idCargo: cargoId,
                    nomeCargo: nomeCargo
                }]
            }).send(response);
        }
    };

    delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.destroy()");

        const cargo = new Cargo();
        cargo.idCargo = request.params.idCargo.toString();

        const excluiu = await this._cargoService.delete(cargo);

        if (excluiu) {
            StandardResponse.noContent().send(response); // 204 sem corpo
        } else {
            StandardResponse.notFound("Cargo não encontrado para exclusão", {
                cargos: [{
                    idCargo: cargo.idCargo
                }]
            }).send(response);
        }
    };
}