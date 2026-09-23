"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioController = void 0;
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class RelatorioController extends BaseController_1.BaseController {
    _relatorioService;
    constructor(relatorioServiceDependency) {
        super();
        console.log("⬆️  RelatorioController.constructor()");
        this._relatorioService = relatorioServiceDependency;
    }
    frequenciaPorTurma = async (request, response) => {
        console.log("🔵 RelatorioController.frequenciaPorTurma()");
        const turma = request.query.turma?.toString() || '';
        const dia = new Date(request.query.dia?.toString() || '');
        const resultado = await this._relatorioService.frequenciaPorTurma(turma, dia);
        StandardResponse_1.StandardResponse.success("Relatório gerado com sucesso", { frequencia: resultado }).send(response);
    };
    faltasPorPeriodo = async (request, response) => {
        console.log("🔵 RelatorioController.faltasPorPeriodo()");
        const turma = request.query.turma?.toString() || '';
        const dataInicio = new Date(request.query.dataInicio?.toString() || '');
        const dataFim = new Date(request.query.dataFim?.toString() || '');
        const resultado = await this._relatorioService.faltasPorTurmaEPeriodo(turma, dataInicio, dataFim);
        StandardResponse_1.StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };
    faltasPorSemana = async (request, response) => {
        console.log("🔵 RelatorioController.faltasPorSemana()");
        const turma = request.query.turma?.toString() || '';
        const data = new Date(request.query.data?.toString() || '');
        const resultado = await this._relatorioService.faltasPorTurmaSemana(turma, data);
        StandardResponse_1.StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };
    faltasPorMes = async (request, response) => {
        console.log("🔵 RelatorioController.faltasPorMes()");
        const turma = request.query.turma?.toString() || '';
        const ano = Number(request.query.ano);
        const mes = Number(request.query.mes);
        const resultado = await this._relatorioService.faltasPorTurmaMes(turma, ano, mes);
        StandardResponse_1.StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };
}
exports.RelatorioController = RelatorioController;
//# sourceMappingURL=RelatorioController.js.map