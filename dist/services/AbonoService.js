"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbonoService = void 0;
const Abono_1 = require("../models/Abono");
const ErrorResponse_1 = require("../http/ErrorResponse");
class AbonoService {
    _abonoDAO;
    _registroDAO;
    constructor(abonoDAODependency, registroDAODependency) {
        console.log("⬆️  AbonoService.constructor()");
        this._abonoDAO = abonoDAODependency;
        this._registroDAO = registroDAODependency;
    }
    create = async (abono, funcionarioLogado) => {
        console.log("🟣 AbonoService.create()");
        const cargosPermitidos = ["Inspetor", "Coordenador", "Secretaria", "Administrador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar abonos.` });
        }
        abono.status = "Pendente";
        return await this._abonoDAO.create(abono, funcionarioLogado);
    };
    findAll = async () => {
        console.log("🟣 AbonoService.findAll()");
        return await this._abonoDAO.findAll();
    };
    findById = async (idAbono) => {
        console.log("🟣 AbonoService.findById()");
        const abono = new Abono_1.Abono();
        abono.idAbono = idAbono;
        return await this._abonoDAO.findById(abono.idAbono);
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 AbonoService.findAllDeleted()");
        const cargosPermitidos = ["Administrador", "Diretor"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar abonos deletados.` });
        }
        return await this._abonoDAO.findAllDeleted();
    };
    update = async (abono, funcionarioLogado) => {
        console.log("🟣 AbonoService.update()");
        const cargosPermitidos = ["Inspetor", "Coordenador", "Secretaria", "Administrador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir abonos.` });
        }
        return await this._abonoDAO.update(abono, funcionarioLogado);
    };
    aprovar = async (idAbono, funcionarioLogado) => {
        console.log("🟣 AbonoService.aprovar()");
        const cargosPermitidos = ["Coordenador", "Administrador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode aprovar abonos.` });
        }
        const abono = await this._abonoDAO.findById(idAbono);
        if (!abono) {
            throw new ErrorResponse_1.ErrorResponse(404, "Abono não encontrado");
        }
        if (abono.status !== "Pendente") {
            throw new ErrorResponse_1.ErrorResponse(400, "Abono já foi analisado", { status: abono.status });
        }
        abono.status = "Aprovado";
        abono.aprovadoPor = funcionarioLogado.idFuncionario;
        await this._abonoDAO.update(abono, funcionarioLogado);
        await this._registroDAO.updateSituacaoPorMatriculaEPeriodo(abono.matricula, abono.dataInicio, abono.dataFim, "Abonada", funcionarioLogado);
        return abono;
    };
    rejeitar = async (idAbono, funcionarioLogado) => {
        console.log("🟣 AbonoService.rejeitar()");
        const cargosPermitidos = ["Coordenador", "Administrador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode rejeitar abonos.` });
        }
        const abono = await this._abonoDAO.findById(idAbono);
        if (!abono) {
            throw new ErrorResponse_1.ErrorResponse(404, "Abono não encontrado");
        }
        if (abono.status !== "Pendente") {
            throw new ErrorResponse_1.ErrorResponse(400, "Abono já foi analisado", { status: abono.status });
        }
        abono.status = "Rejeitado";
        abono.aprovadoPor = funcionarioLogado.idFuncionario;
        await this._abonoDAO.update(abono, funcionarioLogado);
        return abono;
    };
    delete = async (abono, funcionarioLogado) => {
        console.log("🟣 AbonoService.delete()");
        const cargosPermitidos = ["Coordenador", "Administrador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir abonos.` });
        }
        return await this._abonoDAO.delete(abono, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 AbonoService.count()");
        return await this._abonoDAO.count();
    };
}
exports.AbonoService = AbonoService;
//# sourceMappingURL=AbonoService.js.map