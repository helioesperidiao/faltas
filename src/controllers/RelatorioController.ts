import { Request, Response } from "express";
import { RelatorioService } from "../services/RelatorioService";
import { StandardResponse } from "@/http/StandardResponse";
import { BaseController } from "./BaseController";
import { Funcionario } from "@/models/Funcionario";
import { ErrorResponse } from "@/http/ErrorResponse";
import { createLogger } from "../logging/Logger";

const log = createLogger("RelatorioController");

/**
 * Traduz requisições HTTP de relatório em chamadas ao RelatorioService.
 *
 * Todos os endpoints são GET (consultas) e recebem parâmetros via querystring
 * (turma, dia, ano, mes, bimestre, dataInicio, dataFim).
 */
export class RelatorioController extends BaseController {
    private _relatorioService: RelatorioService;

    constructor(relatorioServiceDependency: RelatorioService) {
        super();
        this._relatorioService = relatorioServiceDependency;
    }

    private lerDataDoFechamento = (request: Request): Date => {
        const valor = request.query.data;
        if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            throw new ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        const [ano, mes, dia] = valor.split('-').map(Number);
        const data = new Date(Date.UTC(ano, mes - 1, dia));
        if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
            throw new ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        return data;
    };

    /** Datas de consulta chegam como AAAA-MM-DD e são comparadas à meia-noite UTC, como os registros. */
    private lerDataConsulta = (valor: unknown, nome: string): Date => {
        const texto = typeof valor === 'string' ? valor : '';
        const data = new Date(texto);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== texto) {
            throw new ErrorResponse(400, `Informe ${nome} no formato AAAA-MM-DD.`);
        }
        return data;
    };

    private lerTurma = (valor: unknown): string => {
        const turma = typeof valor === 'string' ? valor.trim() : '';
        if (!turma) {
            throw new ErrorResponse(400, "Selecione a turma.");
        }
        return turma;
    };

    public frequenciaPorTurma = async (request: Request, response: Response): Promise<void> => {
        log.debug("frequenciaPorTurma()", {
            turma: request.query.turma,
            dia: request.query.dia,
        });

        const turma = this.lerTurma(request.query.turma);
        const dia = this.lerDataConsulta(request.query.dia, "o dia");

        const resultado = await this._relatorioService.frequenciaPorTurma(turma, dia);

        StandardResponse.success("Relatório gerado com sucesso", { frequencia: resultado }).send(response);
    };

    public faltasPorPeriodo = async (request: Request, response: Response): Promise<void> => {
        log.debug("faltasPorPeriodo()", {
            turma: request.query.turma,
            dataInicio: request.query.dataInicio,
            dataFim: request.query.dataFim,
        });

        const turma = this.lerTurma(request.query.turma);
        const dataInicio = this.lerDataConsulta(request.query.dataInicio, "a data inicial");
        const dataFim = this.lerDataConsulta(request.query.dataFim, "a data final");
        if (dataFim < dataInicio) {
            throw new ErrorResponse(400, "A data final deve ser igual ou posterior à data inicial.");
        }
        // Inclui o dia final inteiro.
        dataFim.setUTCHours(23, 59, 59, 999);

        const resultado = await this._relatorioService.faltasPorTurmaEPeriodo(turma, dataInicio, dataFim);

        StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };

    public faltasPorSemana = async (request: Request, response: Response): Promise<void> => {
        log.debug("faltasPorSemana()", {
            turma: request.query.turma,
            data: request.query.data,
        });

        const turma = this.lerTurma(request.query.turma);
        const data = this.lerDataConsulta(request.query.data, "a data");

        const resultado = await this._relatorioService.faltasPorTurmaSemana(turma, data);

        StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };

    public faltasPorMes = async (request: Request, response: Response): Promise<void> => {
        log.debug("faltasPorMes()", {
            turma: request.query.turma,
            ano: request.query.ano,
            mes: request.query.mes,
        });

        const turma = this.lerTurma(request.query.turma);
        const ano = Number(request.query.ano);
        const mes = Number(request.query.mes);
        if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
            throw new ErrorResponse(400, "Ano ou mês inválido.");
        }

        const resultado = await this._relatorioService.faltasPorTurmaMes(turma, ano, mes);

        StandardResponse.success("Relatório gerado com sucesso", { faltas: resultado }).send(response);
    };

    public alertasFaltaBimestral = async (request: Request, response: Response): Promise<void> => {
        log.debug("alertasFaltaBimestral()", {
            ano: request.query.ano,
            bimestre: request.query.bimestre,
        });

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
    public fechamentoDia = async (request: Request, response: Response): Promise<void> => {
        const resultado = await this._relatorioService.fechamentoDia(this.lerDataDoFechamento(request));
        StandardResponse.success("Fechamento do dia gerado com sucesso", resultado).send(response);
    };

}
