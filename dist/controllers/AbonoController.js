"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbonoController = void 0;
const Abono_1 = require("@/models/Abono");
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class AbonoController extends BaseController_1.BaseController {
    _abonoService;
    constructor(abonoServiceDependency) {
        super();
        console.log("⬆️  AbonoController.constructor()");
        this._abonoService = abonoServiceDependency;
    }
    create = async (request, response) => {
        console.log("🔵 AbonoController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const novoAbono = new Abono_1.Abono();
        novoAbono.matricula = request.body.abono.matricula;
        novoAbono.dataInicio = new Date(request.body.abono.dataInicio);
        novoAbono.dataFim = new Date(request.body.abono.dataFim);
        novoAbono.motivo = request.body.abono.motivo;
        const resultado = await this._abonoService.create(novoAbono, funcionarioLogado);
        StandardResponse_1.StandardResponse.created("Abono cadastrado com sucesso", {
            abonos: [resultado]
        }).send(response);
    };
    uploadArquivo = async (request, response) => {
        console.log("🔵 AbonoController.uploadArquivo()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        if (!request.file) {
            StandardResponse_1.StandardResponse.error("Nenhum arquivo enviado", null, 400).send(response);
            return;
        }
        const idAbono = request.params.idAbono.toString();
        const abonoExistente = await this._abonoService.findById(idAbono);
        if (!abonoExistente) {
            StandardResponse_1.StandardResponse.notFound("Abono não encontrado", {
                message: `Não existe abono com id ${idAbono}`
            }).send(response);
            return;
        }
        abonoExistente.nomeArquivo = request.file.filename;
        const atualizou = await this._abonoService.update(abonoExistente, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Arquivo enviado com sucesso", {
                abonos: [abonoExistente]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.error("Falha ao salvar referência do arquivo", null, 500).send(response);
        }
    };
    findAll = async (_request, response) => {
        console.log("🔵 AbonoController.findAll()");
        const arrayAbonos = await this._abonoService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            abonos: arrayAbonos
        }).send(response);
    };
    findAllDeleted = async (request, response) => {
        console.log("🔵 AbonoController.findAllDeleted()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const abonosDeletados = await this._abonoService.findAllDeleted(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca de abonos deletados realizada com sucesso", {
            abonos: abonosDeletados
        }).send(response);
    };
    findById = async (_request, response) => {
        console.log("🔵 AbonoController.findById()");
        const abonoId = _request.params.idAbono.toString();
        const abono = await this._abonoService.findById(abonoId);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            abonos: abono
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 AbonoController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const abonoId = request.params.idAbono.toString();
        const abono = new Abono_1.Abono();
        abono.idAbono = abonoId;
        abono.matricula = request.body.abono.matricula;
        abono.dataInicio = new Date(request.body.abono.dataInicio);
        abono.dataFim = new Date(request.body.abono.dataFim);
        abono.motivo = request.body.abono.motivo;
        abono.nomeArquivo = request.body.abono.nomeArquivo || '';
        abono.status = 'Pendente';
        const atualizou = await this._abonoService.update(abono, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                abonos: [abono]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Abono não encontrado para atualização", {
                abonos: [abono]
            }).send(response);
        }
    };
    aprovar = async (request, response) => {
        console.log("🔵 AbonoController.aprovar()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idAbono = request.params.idAbono.toString();
        const abono = await this._abonoService.aprovar(idAbono, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Abono aprovado com sucesso", {
            abonos: [abono]
        }).send(response);
    };
    rejeitar = async (request, response) => {
        console.log("🔵 AbonoController.rejeitar()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idAbono = request.params.idAbono.toString();
        const abono = await this._abonoService.rejeitar(idAbono, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Abono rejeitado com sucesso", {
            abonos: [abono]
        }).send(response);
    };
    delete = async (request, response) => {
        console.log("🔵 AbonoController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const abono = new Abono_1.Abono();
        abono.idAbono = request.params.idAbono.toString();
        const excluiu = await this._abonoService.delete(abono, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Abono não encontrado para exclusão", {
                abonos: [{
                        idAbono: abono.idAbono
                    }]
            }).send(response);
        }
    };
    count = async (_request, response) => {
        console.log("🔵 AbonoController.count()");
        const total = await this._abonoService.count();
        StandardResponse_1.StandardResponse.success("Total de abonos obtido", { total }).send(response);
    };
}
exports.AbonoController = AbonoController;
//# sourceMappingURL=AbonoController.js.map