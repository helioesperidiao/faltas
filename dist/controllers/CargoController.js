"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoController = void 0;
const Cargo_1 = require("@/models/Cargo");
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class CargoController extends BaseController_1.BaseController {
    _cargoService;
    constructor(cargoServiceDependency) {
        super();
        console.log("⬆️  CargoController.constructor()");
        this._cargoService = cargoServiceDependency;
    }
    create = async (request, response) => {
        console.log("🔵 CargoController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const novoCargo = new Cargo_1.Cargo();
        novoCargo.nomeCargo = request.body.cargo.nomeCargo;
        const resultado = await this._cargoService.create(novoCargo, funcionarioLogado);
        if (!resultado) {
            StandardResponse_1.StandardResponse.error("Falha ao cadastrar novo Cargo", null, 500).send(response);
            return;
        }
        StandardResponse_1.StandardResponse.created("Cadastro realizado com sucesso", {
            cargos: [{
                    idCargo: novoCargo.idCargo,
                    nomeCargo: novoCargo.nomeCargo
                }]
        }).send(response);
    };
    findAll = async (_request, response) => {
        console.log("🔵 CargoController.findAll()");
        const arrayCargos = await this._cargoService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            cargos: arrayCargos
        }).send(response);
    };
    findAllDeleted = async (request, response) => {
        console.log("🔵 CargoController.findAllDeleted()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargosDeletados = await this._cargoService.findAllDeleted(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca de cargos deletados realizada com sucesso", {
            cargos: cargosDeletados
        }).send(response);
    };
    findById = async (_request, response) => {
        console.log("🔵 CargoController.findById()");
        const cargoId = _request.params.idCargo.toString();
        const cargo = await this._cargoService.findById(cargoId);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            cargos: cargo
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 CargoController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const nomeCargo = request.body.cargo.nomeCargo;
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = cargoId;
        cargo.nomeCargo = nomeCargo;
        const atualizou = await this._cargoService.update(cargo, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                cargos: [{
                        idCargo: cargoId,
                        nomeCargo: nomeCargo
                    }]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Cargo não encontrado para atualização", {
                cargos: [{
                        idCargo: cargoId,
                        nomeCargo: nomeCargo
                    }]
            }).send(response);
        }
    };
    delete = async (request, response) => {
        console.log("🔵 CargoController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = request.params.idCargo.toString();
        const excluiu = await this._cargoService.delete(cargo, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Cargo não encontrado para exclusão", {
                cargos: [{
                        idCargo: cargo.idCargo
                    }]
            }).send(response);
        }
    };
    count = async (_request, response) => {
        console.log("🔵 CargoController.count()");
        const total = await this._cargoService.count();
        StandardResponse_1.StandardResponse.success("Total de cargos obtido", { total }).send(response);
    };
}
exports.CargoController = CargoController;
//# sourceMappingURL=CargoController.js.map