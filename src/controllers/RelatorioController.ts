import { Request, Response } from "express";
import { RelatorioService } from "../services/RelatorioService";
import { StandardResponse } from "@/http/StandardResponse";
import { BaseController } from "./BaseController";
import { Funcionario } from "@/models/Funcionario";

export class RelatorioController extends BaseController {
    private _relatorioService: RelatorioService;

    constructor(relatorioServiceDependency: RelatorioService) {
        super();
        console.log("⬆️  RelatorioController.constructor()");
        this._relatorioService = relatorioServiceDependency;
    }

    public frequenciaPorTurma = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RelatorioController.frequenciaPorTurma()");

        const turma = request.query.turma?.toString() || '';
        const dia = new Date(request.query.dia?.toString() || '');

        const resultado = await this._relatorioService.frequenciaPorTurma(turma, dia);

        StandardResponse.success("Relatório gerado com sucesso", { frequencia: resultado }).send(response);
    };

    public faltasPorPeriodo = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RelatorioController.faltasPorPeriodo()");

        const turma = request.query.turma?.toString() || '';
        const dataInicio = new Date(request.query.dataInicio?.toString() || '');
        const dataFim = new Date(request.query.dataFim?.toString() || '');

        const resultado = await this._relatorioService.faltasPorTurmaEPeriodo(turma, dataInicio, dataFim);

        StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };

    public faltasPorSemana = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RelatorioController.faltasPorSemana()");

        const turma = request.query.turma?.toString() || '';
        const data = new Date(request.query.data?.toString() || '');

        const resultado = await this._relatorioService.faltasPorTurmaSemana(turma, data);

        StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };

    public faltasPorMes = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RelatorioController.faltasPorMes()");

        const turma = request.query.turma?.toString() || '';
        const ano = Number(request.query.ano);
        const mes = Number(request.query.mes);

        const resultado = await this._relatorioService.faltasPorTurmaMes(turma, ano, mes);

        StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };

    public alertasFaltaBimestral = async (request: Request, response: Response): Promise<void> => {
        const agora = new Date();
        const ano = request.query.ano == null ? agora.getFullYear() : Number(request.query.ano);
        const bimestreAtual = agora.getMonth() + 1;
        const bimestre = request.query.bimestre == null
            ? (bimestreAtual <= 3 ? 1 : bimestreAtual <= 7 ? 2 : bimestreAtual <= 9 ? 3 : 4)
            : Number(request.query.bimestre);
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const resultado = await this._relatorioService.alertasFaltaBimestral(ano, bimestre, funcionarioLogado);
        StandardResponse.success("Alertas de faltas obtidos com sucesso", resultado).send(response);
    };
}
