"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoService = void 0;
const Cargo_1 = require("../models/Cargo");
const ErrorResponse_1 = require("../http/ErrorResponse");
class CargoService {
    _cargoDAO;
    constructor(cargoDAODependency) {
        console.log("⬆️  CargoService.constructor()");
        this._cargoDAO = cargoDAODependency;
    }
    create = async (cargo, funcionarioLogado) => {
        console.log("🟣 CargoService.createCargo()");
        if (funcionarioLogado.cargo.nomeCargo !== "Administrador") {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não é autorizado a criar cargos.` });
        }
        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        if (resultado.length > 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Cargo já existe", { message: `O cargo "${cargo.nomeCargo}" já existe.` });
        }
        return await this._cargoDAO.create(cargo, funcionarioLogado);
    };
    findAll = async () => {
        console.log("🟣 CargoService.findAll()");
        return await this._cargoDAO.findAll();
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 CargoService.findAllDeleted()");
        const cargosPermitidos = ["Administrador", "Diretor"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar cargos deletados.` });
        }
        return await this._cargoDAO.findAllDeleted();
    };
    findById = async (idCargo) => {
        console.log("🟣 CargoService.findById()");
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = idCargo;
        return await this._cargoDAO.findById(cargo.idCargo);
    };
    update = async (cargo, funcionarioLogado) => {
        console.log("🟣 CargoService.updateCargo()");
        return await this._cargoDAO.update(cargo, funcionarioLogado);
    };
    delete = async (cargo, funcionarioLogado) => {
        console.log("🟣 CargoService.delete()");
        return await this._cargoDAO.delete(cargo, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 CargoService.countCargos()");
        return await this._cargoDAO.count();
    };
}
exports.CargoService = CargoService;
//# sourceMappingURL=CargoService.js.map