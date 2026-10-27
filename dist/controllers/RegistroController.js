"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistroController = void 0;
const Registro_1 = require("@/models/Registro");
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class RegistroController extends BaseController_1.BaseController {
    _registroService;
    constructor(registroServiceDependency) {
        super();
        console.log("⬆️  RegistroController.constructor()");
        this._registroService = registroServiceDependency;
    }
    create = async (request, response) => {
        console.log("🔵 RegistroController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const novoRegistro = new Registro_1.Registro();
        novoRegistro.ano = request.body.registro.ano;
        novoRegistro.codDisciplina = request.body.registro.codDisciplina;
        novoRegistro.horaInicio = request.body.registro.horaInicio;
        novoRegistro.horaFim = request.body.registro.horaFim;
        novoRegistro.matricula = request.body.registro.matricula;
        novoRegistro.falta = request.body.registro.falta;
        novoRegistro.dia = new Date(request.body.registro.dia);
        novoRegistro.atrasado = request.body.registro.atrasado;
        if (request.body.registro.nomeAcompanhante) {
            novoRegistro.nomeAcompanhante = request.body.registro.nomeAcompanhante;
        }
        const resultado = await this._registroService.create(novoRegistro, funcionarioLogado);
        if (!resultado) {
            StandardResponse_1.StandardResponse.error("Falha ao cadastrar novo Registro", null, 500).send(response);
            return;
        }
        StandardResponse_1.StandardResponse.created("Registro cadastrado com sucesso", {
            registros: [novoRegistro]
        }).send(response);
    };
    findAll = async (_request, response) => {
        console.log("🔵 RegistroController.findAll()");
        const arrayRegistros = await this._registroService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            registros: arrayRegistros
        }).send(response);
    };
    findAllDeleted = async (request, response) => {
        console.log("🔵 RegistroController.findAllDeleted()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const registrosDeletados = await this._registroService.findAllDeleted(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca de registros deletados realizada com sucesso", {
            registros: registrosDeletados
        }).send(response);
    };
    findAusentesEntrada = async (request, response) => {
        console.log("🔵 RegistroController.findAusentesEntrada()");
        const turma = request.query.turma?.toString() || '';
        const diaQuery = request.query.dia?.toString() || '';
        if (!turma || !diaQuery) {
            StandardResponse_1.StandardResponse.error("Parâmetros 'turma' e 'dia' são obrigatórios", null, 400).send(response);
            return;
        }
        const dia = new Date(diaQuery);
        const ausentes = await this._registroService.findAusentesEntrada(turma, dia);
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            registros: ausentes
        }).send(response);
    };
    findChamadaPorTurmaEDia = async (request, response) => {
        const turma = request.query.turma?.toString() || '';
        const diaTexto = request.query.dia?.toString() || '';
        const dia = new Date(diaTexto);
        if (!turma || !diaTexto || Number.isNaN(dia.getTime())) {
            StandardResponse_1.StandardResponse.error("Parâmetros 'turma' e 'dia' são obrigatórios", null, 400).send(response);
            return;
        }
        const registros = await this._registroService.findChamadaPorTurmaEDia(turma, dia);
        StandardResponse_1.StandardResponse.success("Chamada consultada com sucesso", { registros }).send(response);
    };
    findById = async (_request, response) => {
        console.log("🔵 RegistroController.findById()");
        const registroId = _request.params.idRegistro.toString();
        const registro = await this._registroService.findById(registroId);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            registros: registro
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 RegistroController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const registroId = request.params.idRegistro.toString();
        const registro = new Registro_1.Registro();
        registro.idRegistro = registroId;
        registro.falta = request.body.registro.falta;
        registro.atrasado = request.body.registro.atrasado;
        registro.nomeAcompanhante = request.body.registro.nomeAcompanhante || '';
        const atualizou = await this._registroService.update(registro, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                registros: [registro]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Registro não encontrado para atualização", {
                registros: [registro]
            }).send(response);
        }
    };
    delete = async (request, response) => {
        console.log("🔵 RegistroController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const registro = new Registro_1.Registro();
        registro.idRegistro = request.params.idRegistro.toString();
        const excluiu = await this._registroService.delete(registro, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Registro não encontrado para exclusão", {
                registros: [{
                        idRegistro: registro.idRegistro
                    }]
            }).send(response);
        }
    };
    count = async (_request, response) => {
        console.log("🔵 RegistroController.count()");
        const total = await this._registroService.count();
        StandardResponse_1.StandardResponse.success("Total de registros obtido", { total }).send(response);
    };
}
exports.RegistroController = RegistroController;
//# sourceMappingURL=RegistroController.js.map