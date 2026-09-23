"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistroService = void 0;
const Registro_1 = require("../models/Registro");
const ErrorResponse_1 = require("../http/ErrorResponse");
class RegistroService {
    _registroDAO;
    _dispensaDAO;
    _alunoDAO;
    constructor(registroDAODependency, dispensaDAODependency, alunoDAODependency) {
        console.log("⬆️  RegistroService.constructor()");
        this._registroDAO = registroDAODependency;
        this._dispensaDAO = dispensaDAODependency;
        this._alunoDAO = alunoDAODependency;
    }
    create = async (registro, funcionarioLogado) => {
        console.log("🟣 RegistroService.create()");
        const cargosPermitidos = ["Inspetor", "Administrador", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode registrar chamada.` });
        }
        const dispensaVigente = await this._dispensaDAO.findVigenteParaAluno(registro.matricula, registro.codDisciplina, registro.dia);
        if (dispensaVigente) {
            registro.falta = false;
            registro.situacao = "Dispensada";
        }
        return await this._registroDAO.create(registro, funcionarioLogado);
    };
    findAll = async () => {
        console.log("🟣 RegistroService.findAll()");
        return await this._registroDAO.findAll();
    };
    findById = async (idRegistro) => {
        console.log("🟣 RegistroService.findById()");
        const registro = new Registro_1.Registro();
        registro.idRegistro = idRegistro;
        return await this._registroDAO.findById(registro.idRegistro);
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 RegistroService.findAllDeleted()");
        const cargosPermitidos = ["Administrador", "Diretor"];
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!cargosPermitidos.includes(cargoFuncionario)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar registros deletados.` });
        }
        return await this._registroDAO.findAllDeleted();
    };
    findAusentesEntrada = async (turma, dia) => {
        console.log("🟣 RegistroService.findAusentesEntrada()");
        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const matriculas = alunosDaTurma.map(aluno => aluno.matricula);
        const todosRegistrosDoDia = await this._registroDAO.findAll();
        const dataAlvo = new Date(dia);
        return todosRegistrosDoDia.filter(registro => matriculas.includes(registro.matricula) &&
            registro.falta === true &&
            registro.dia.toDateString() === dataAlvo.toDateString());
    };
    update = async (registro, funcionarioLogado) => {
        console.log("🟣 RegistroService.update()");
        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode corrigir registros.` });
        }
        return await this._registroDAO.update(registro, funcionarioLogado);
    };
    delete = async (registro, funcionarioLogado) => {
        console.log("🟣 RegistroService.delete()");
        const cargosPermitidos = ["Inspetor", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir registros.` });
        }
        return await this._registroDAO.delete(registro, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 RegistroService.count()");
        return await this._registroDAO.count();
    };
}
exports.RegistroService = RegistroService;
//# sourceMappingURL=RegistroService.js.map