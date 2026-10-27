"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoService = void 0;
const Cargo_1 = require("../models/Cargo");
const ErrorResponse_1 = require("../http/ErrorResponse");
const Cargos_1 = require("@/constants/Cargos");
class CargoService {
    _cargoDAO;
    constructor(cargoDAODependency) {
        console.log("⬆️  CargoService.constructor()");
        this._cargoDAO = cargoDAODependency;
    }
    create = async (cargo, funcionarioLogado) => {
        console.log("🟣 CargoService.createCargo()");
        if (funcionarioLogado.cargo.nomeCargo !== Cargos_1.CARGO_PROCESSO_PEDAGOGICO) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não é autorizado a criar cargos.` });
        }
        const nomeCanonico = (0, Cargos_1.nomeCargoCanonico)(cargo.nomeCargo);
        if (!nomeCanonico || !(0, Cargos_1.cargoAceito)(cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(400, "Cargo inválido", {
                message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
            });
        }
        cargo.nomeCargo = nomeCanonico;
        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        if (resultado.length > 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Cargo já existe", { message: `O cargo "${cargo.nomeCargo}" já existe.` });
        }
        return await this._cargoDAO.create(cargo, funcionarioLogado);
    };
    findAll = async () => {
        console.log("🟣 CargoService.findAll()");
        const cargos = await this._cargoDAO.findAll();
        return cargos.filter(cargo => (0, Cargos_1.cargoAceito)(cargo.nomeCargo));
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 CargoService.findAllDeleted()");
        const cargosPermitidos = [Cargos_1.CARGO_PROCESSO_PEDAGOGICO];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar cargos deletados.` });
        }
        const cargos = await this._cargoDAO.findAllDeleted();
        return cargos.filter(cargo => (0, Cargos_1.cargoAceito)(cargo.nomeCargo));
    };
    findById = async (idCargo) => {
        console.log("🟣 CargoService.findById()");
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = idCargo;
        return await this._cargoDAO.findById(cargo.idCargo);
    };
    update = async (cargo, funcionarioLogado) => {
        console.log("🟣 CargoService.updateCargo()");
        if (funcionarioLogado.cargo.nomeCargo !== Cargos_1.CARGO_PROCESSO_PEDAGOGICO) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado");
        }
        const nomeCanonico = (0, Cargos_1.nomeCargoCanonico)(cargo.nomeCargo);
        if (!nomeCanonico) {
            throw new ErrorResponse_1.ErrorResponse(400, "Cargo inválido", {
                message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
            });
        }
        const cargoExistente = await this._cargoDAO.findById(cargo.idCargo);
        if (!cargoExistente) {
            return false;
        }
        cargo.nomeCargo = nomeCanonico;
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