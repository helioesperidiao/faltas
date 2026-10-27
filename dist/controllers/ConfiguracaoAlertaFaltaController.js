"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracaoAlertaFaltaController = void 0;
const BaseController_1 = require("./BaseController");
const StandardResponse_1 = require("@/http/StandardResponse");
class ConfiguracaoAlertaFaltaController extends BaseController_1.BaseController {
    service;
    constructor(service) {
        super();
        this.service = service;
    }
    findAll = async (request, response) => {
        const configuracoes = await this.service.findAll(this.getFuncionarioLogado(request));
        StandardResponse_1.StandardResponse.success("Configurações de alerta obtidas com sucesso", { configuracoes }).send(response);
    };
    create = async (request, response) => {
        const dados = request.body.configuracao || {};
        const configuracao = await this.service.create(Number(dados.cargaHorariaSemanalMinutos), Number(dados.limiteFaltas), this.getFuncionarioLogado(request));
        StandardResponse_1.StandardResponse.created("Configuração de alerta criada com sucesso", { configuracoes: [configuracao] }).send(response);
    };
    update = async (request, response) => {
        const dados = request.body.configuracao || {};
        const atualizou = await this.service.update(String(request.params.idConfiguracao), Number(dados.cargaHorariaSemanalMinutos), Number(dados.limiteFaltas), this.getFuncionarioLogado(request));
        if (!atualizou) {
            StandardResponse_1.StandardResponse.notFound("Configuração de alerta não encontrada").send(response);
            return;
        }
        StandardResponse_1.StandardResponse.success("Configuração de alerta atualizada com sucesso").send(response);
    };
    delete = async (request, response) => {
        const funcionario = this.getFuncionarioLogado(request);
        const excluiu = await this.service.delete(String(request.params.idConfiguracao), funcionario);
        if (!excluiu) {
            StandardResponse_1.StandardResponse.notFound("Configuração de alerta não encontrada").send(response);
            return;
        }
        StandardResponse_1.StandardResponse.noContent().send(response);
    };
}
exports.ConfiguracaoAlertaFaltaController = ConfiguracaoAlertaFaltaController;
//# sourceMappingURL=ConfiguracaoAlertaFaltaController.js.map