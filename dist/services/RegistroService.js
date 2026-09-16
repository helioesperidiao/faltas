"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistroService = void 0;
const Registro_1 = require("../models/Registro");
const ErrorResponse_1 = require("../http/ErrorResponse");
const CARGOS_ACESSO_TOTAL = ["Processo Pedagógico"];
class RegistroService {
    _registroDAO;
    _alunoDAO;
    constructor(registroDAODependency, alunoDAODependency) {
        console.log("⬆️  RegistroService.constructor()");
        this._registroDAO = registroDAODependency;
        this._alunoDAO = alunoDAODependency;
    }
    create = async (registro, funcionarioLogado) => {
        console.log("🟣 RegistroService.create()");
        const aluno = await this._alunoDAO.findByField("matricula", registro.matricula);
        if (aluno.length === 0) {
            throw new ErrorResponse_1.ErrorResponse(404, "Aluno não encontrado", { matricula: registro.matricula });
        }
        registro.alunoNome = aluno[0].alunoNome;
        registro.turma = aluno[0].turma;
        registro.curso = aluno[0].curso;
        registro.serie = aluno[0].serie;
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
        const cargoFuncionario = funcionarioLogado.cargo.nomeCargo;
        if (!CARGOS_ACESSO_TOTAL.includes(cargoFuncionario)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${CARGOS_ACESSO_TOTAL.join(", ")} podem visualizar registros deletados.` });
        }
        return await this._registroDAO.findAllDeleted();
    };
    update = async (registro, funcionarioLogado) => {
        console.log("🟣 RegistroService.update()");
        return await this._registroDAO.update(registro, funcionarioLogado);
    };
    delete = async (registro, funcionarioLogado) => {
        console.log("🟣 RegistroService.delete()");
        return await this._registroDAO.delete(registro, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 RegistroService.count()");
        return await this._registroDAO.count();
    };
    findAusentesEntrada = async (turma, dia) => {
        console.log("🟣 RegistroService.findAusentesEntrada()");
        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const matriculas = alunosDaTurma.map(aluno => aluno.matricula);
        if (matriculas.length === 0) {
            return [];
        }
        return await this._registroDAO.findAusentesEntrada(matriculas, dia);
    };
}
exports.RegistroService = RegistroService;
//# sourceMappingURL=RegistroService.js.map