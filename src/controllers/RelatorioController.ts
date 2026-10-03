import { Request, Response } from "express";
import { RelatorioService } from "../services/RelatorioService";
import { StandardResponse } from "@/http/StandardResponse";
import { BaseController } from "./BaseController";
import { Funcionario } from "@/models/Funcionario";
import { ErrorResponse } from "@/http/ErrorResponse";
import PDFDocument from "pdfkit";

export class RelatorioController extends BaseController {
    private _relatorioService: RelatorioService;

    constructor(relatorioServiceDependency: RelatorioService) {
        super();
        console.log("⬆️  RelatorioController.constructor()");
        this._relatorioService = relatorioServiceDependency;
    }

    private lerDataDoFechamento = (request: Request): Date => {
        const valor = request.query.data;
        if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            throw new ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        const [ano, mes, dia] = valor.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);
        if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
            throw new ErrorResponse(400, "Data inválida. Use o formato AAAA-MM-DD.");
        }
        return data;
    };

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

    public fechamentoDia = async (request: Request, response: Response): Promise<void> => {
        const resultado = await this._relatorioService.fechamentoDia(this.lerDataDoFechamento(request));
        StandardResponse.success("Fechamento do dia gerado com sucesso", resultado).send(response);
    };

    /** Gera um PDF resumido do fechamento, além dos CSVs baixados pela tela. */
    public fechamentoDiaPdf = async (request: Request, response: Response): Promise<void> => {
        const resultado = await this._relatorioService.fechamentoDia(this.lerDataDoFechamento(request));
        const documento = new PDFDocument({ margin: 48, size: 'A4' });
        const nomeArquivo = `fechamento-${resultado.data}.pdf`;

        response.status(200);
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
        documento.pipe(response);

        documento.fontSize(18).fillColor('#0f2a4d').text('UNIVAP - Fechamento do dia');
        documento.moveDown(0.25);
        documento.fontSize(11).fillColor('#1f2937').text(`Data: ${resultado.data.split('-').reverse().join('/')}`);
        documento.moveDown();
        documento.fontSize(11).text(
            `Atrasados: ${resultado.atrasados.length}  |  Saídas antecipadas: ${resultado.saidasAntecipadas.length}  |  Faltas: ${resultado.faltasDoDia.length}`
        );
        documento.moveDown();

        const escreverSecao = (titulo: string, linhas: Array<{ alunoNome: string; matricula: string; horario?: string; emailPai: string }>): void => {
            documento.fontSize(13).fillColor('#0f2a4d').text(titulo);
            documento.moveDown(0.3);
            documento.fontSize(9).fillColor('#1f2937');
            if (linhas.length === 0) {
                documento.text('Nenhum registro.');
                documento.moveDown();
                return;
            }
            linhas.forEach(linha => {
                if (documento.y > 730) documento.addPage();
                const horario = linha.horario ? ` - ${linha.horario}` : '';
                const email = linha.emailPai ? ` - ${linha.emailPai}` : ' - sem e-mail do pai cadastrado';
                documento.text(`${linha.alunoNome} (${linha.matricula})${horario}${email}`);
            });
            documento.moveDown();
        };

        escreverSecao('Alunos atrasados', resultado.atrasados);
        escreverSecao('Saídas antecipadas', resultado.saidasAntecipadas);
        escreverSecao('Faltas do dia', resultado.faltasDoDia);
        documento.fontSize(9).fillColor('#667085').text(`Faltas registradas no histórico da escola: ${resultado.faltasHistoricas.length}`);
        documento.end();
    };
}
