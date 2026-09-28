"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensaController = void 0;
const Dispensa_1 = require("@/models/Dispensa");
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class DispensaController extends BaseController_1.BaseController {
    _dispensaService;
    constructor(dispensaServiceDependency) {
        super();
        console.log("⬆️  DispensaController.constructor()");
        this._dispensaService = dispensaServiceDependency;
    }
    create = async (request, response) => {
        console.log("🔵 DispensaController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const novaDispensa = new Dispensa_1.Dispensa();
        novaDispensa.idAluno = request.body.dispensa.idAluno;
        novaDispensa.turma = request.body.dispensa.turma;
        novaDispensa.horaInicio = request.body.dispensa.horaInicio;
        novaDispensa.horaFim = request.body.dispensa.horaFim;
        novaDispensa.dia = new Date(request.body.dispensa.dia);
        ;
        novaDispensa.dataFim = request.body.dispensa.dataFim ? new Date(request.body.dispensa.dataFim) : novaDispensa.dia;
        novaDispensa.cod = request.body.dispensa.cod;
        novaDispensa.disciplina = request.body.dispensa.disciplina;
        novaDispensa.motivo = request.body.dispensa.motivo;
        if (request.body.dispensa.nomeArquivo) {
            novaDispensa.nomeArquivo = request.body.dispensa.nomeArquivo;
        }
        const resultado = await this._dispensaService.create(novaDispensa, funcionarioLogado);
        if (!resultado) {
            StandardResponse_1.StandardResponse.error("Falha ao cadastrar nova Dispensa", null, 500).send(response);
            return;
        }
        StandardResponse_1.StandardResponse.created("Dispensa cadastrada com sucesso", {
            dispensas: [novaDispensa]
        }).send(response);
    };
    uploadArquivo = async (request, response) => {
        console.log("🔵 DispensaController.uploadArquivo()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        if (!request.file) {
            StandardResponse_1.StandardResponse.error("Nenhum arquivo enviado", null, 400).send(response);
            return;
        }
        const idDispensa = request.params.idDispensa.toString();
        const dispensaExistente = await this._dispensaService.findById(idDispensa);
        if (!dispensaExistente) {
            StandardResponse_1.StandardResponse.notFound("Dispensa não encontrada", {
                message: `Não existe dispensa com id ${idDispensa}`
            }).send(response);
            return;
        }
        dispensaExistente.nomeArquivo = request.file.filename;
        const atualizou = await this._dispensaService.update(dispensaExistente, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Arquivo enviado com sucesso", {
                dispensas: [dispensaExistente]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.error("Falha ao salvar referência do arquivo", null, 500).send(response);
        }
    };
    findAll = async (_request, response) => {
        console.log("🔵 DispensaController.findAll()");
        const arrayDispensas = await this._dispensaService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            dispensas: arrayDispensas
        }).send(response);
    };
    findAllDeleted = async (request, response) => {
        console.log("🔵 DispensaController.findAllDeleted()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dispensasDeletadas = await this._dispensaService.findAllDeleted(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca de dispensas deletadas realizada com sucesso", {
            dispensas: dispensasDeletadas
        }).send(response);
    };
    findById = async (_request, response) => {
        console.log("🔵 DispensaController.findById()");
        const dispensaId = _request.params.idDispensa.toString();
        const dispensa = await this._dispensaService.findById(dispensaId);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            dispensas: dispensa
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 DispensaController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dispensaId = request.params.idDispensa.toString();
        const dispensa = new Dispensa_1.Dispensa();
        dispensa.idDispensa = dispensaId;
        dispensa.turma = request.body.dispensa.turma;
        dispensa.horaInicio = request.body.dispensa.horaInicio;
        dispensa.horaFim = request.body.dispensa.horaFim;
        dispensa.dia = request.body.dispensa.dia;
        dispensa.dataFim = request.body.dispensa.dataFim ? new Date(request.body.dispensa.dataFim) : new Date(request.body.dispensa.dia);
        dispensa.cod = request.body.dispensa.cod;
        dispensa.disciplina = request.body.dispensa.disciplina;
        dispensa.motivo = request.body.dispensa.motivo;
        dispensa.nomeArquivo = request.body.dispensa.nomeArquivo || '';
        const atualizou = await this._dispensaService.update(dispensa, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                dispensas: [dispensa]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Dispensa não encontrada para atualização", {
                dispensas: [dispensa]
            }).send(response);
        }
    };
    delete = async (request, response) => {
        console.log("🔵 DispensaController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dispensa = new Dispensa_1.Dispensa();
        dispensa.idDispensa = request.params.idDispensa.toString();
        const excluiu = await this._dispensaService.delete(dispensa, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Dispensa não encontrada para exclusão", {
                dispensas: [{
                        idDispensa: dispensa.idDispensa
                    }]
            }).send(response);
        }
    };
    count = async (_request, response) => {
        console.log("🔵 DispensaController.count()");
        const total = await this._dispensaService.count();
        StandardResponse_1.StandardResponse.success("Total de dispensas obtido", { total }).send(response);
    };
}
exports.DispensaController = DispensaController;
//# sourceMappingURL=DispensaController.js.map