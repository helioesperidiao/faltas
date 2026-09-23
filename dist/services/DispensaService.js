"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensaService = void 0;
const Dispensa_1 = require("../models/Dispensa");
const ErrorResponse_1 = require("../http/ErrorResponse");
class DispensaService {
    _dispensaDAO;
    constructor(dispensaDAODependency) {
        console.log("⬆️  DispensaService.constructor()");
        this._dispensaDAO = dispensaDAODependency;
    }
    create = async (dispensa, funcionarioLogado) => {
        console.log("🟣 DispensaService.create()");
        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar dispensa.` });
        }
        return await this._dispensaDAO.create(dispensa, funcionarioLogado);
    };
    findAll = async () => {
        console.log("🟣 DispensaService.findAll()");
        return await this._dispensaDAO.findAll();
    };
    findById = async (idDispensa) => {
        console.log("🟣 DispensaService.findById()");
        const dispensa = new Dispensa_1.Dispensa();
        dispensa.idDispensa = idDispensa;
        return await this._dispensaDAO.findById(dispensa.idDispensa);
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 DispensaService.findAllDeleted()");
        const cargosPermitidos = ["Administrador", "Diretor"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar dispensas deletadas.` });
        }
        return await this._dispensaDAO.findAllDeleted();
    };
    update = async (dispensa, funcionarioLogado) => {
        console.log("🟣 DispensaService.update()");
        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir dispensas.` });
        }
        return await this._dispensaDAO.update(dispensa, funcionarioLogado);
    };
    delete = async (dispensa, funcionarioLogado) => {
        console.log("🟣 DispensaService.delete()");
        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir dispensas.` });
        }
        return await this._dispensaDAO.delete(dispensa, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 DispensaService.count()");
        return await this._dispensaDAO.count();
    };
}
exports.DispensaService = DispensaService;
//# sourceMappingURL=DispensaService.js.map