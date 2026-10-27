"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioController = void 0;
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
const ErrorResponse_1 = require("@/http/ErrorResponse");
class RelatorioController extends BaseController_1.BaseController {
    _relatorioService;
    constructor(relatorioServiceDependency) {
        super();
        console.log("⬆️  RelatorioController.constructor()");
        this._relatorioService = relatorioServiceDependency;
    }
    lerDataDoFechamento = (request) => {
        const valor = request.query.data;
        if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            throw new ErrorResponse_1.ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        const [ano, mes, dia] = valor.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);
        if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
            throw new ErrorResponse_1.ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        return data;
    };
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
    alertasFaltaBimestral = async (request, response) => {
        const agora = new Date();
        const ano = request.query.ano == null ? agora.getFullYear() : Number(request.query.ano);
        const bimestreAtual = agora.getMonth() + 1;
        const bimestre = request.query.bimestre == null
            ? (bimestreAtual <= 3 ? 1 : bimestreAtual <= 7 ? 2 : bimestreAtual <= 9 ? 3 : 4)
            : Number(request.query.bimestre);
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const resultado = await this._relatorioService.alertasFaltaBimestral(ano, bimestre, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Alertas de faltas obtidos com sucesso", resultado).send(response);
    };
    fechamentoDia = async (request, response) => {
        const resultado = await this._relatorioService.fechamentoDia(this.lerDataDoFechamento(request));
        StandardResponse_1.StandardResponse.success("Fechamento do dia gerado com sucesso", resultado).send(response);
    };
}
exports.RelatorioController = RelatorioController;
//# sourceMappingURL=RelatorioController.js.map