import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { Movimentacao } from "../models/Movimentacao";
import { StandardResponse } from "../http/StandardResponse";
import { BaseController } from "./BaseController";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("MovimentacaoController");

/**
 * Traduz requisições HTTP de movimentação (entrada/saída) em chamadas ao service.
 *
 * GET aceita querystring opcional `data=AAAA-MM-DD` para filtrar por dia.
 */
export class MovimentacaoController extends BaseController {
    constructor(private readonly movimentacaoService: MovimentacaoService) { super(); }

    private montarMovimentacao = (dados: any): Movimentacao => {
        const movimentacao = new Movimentacao();
        movimentacao.nomeAluno = dados.nomeAluno;
        movimentacao.matricula = dados.matricula;
        const data = String(dados.data || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || isNaN(Date.parse(data)) || new Date(data).toISOString().slice(0, 10) !== data) throw new Error("Data inválida.");
        movimentacao.data = new Date(data);
        movimentacao.horario = dados.horario;
        movimentacao.tipo = dados.tipo;
        movimentacao.motivo = dados.motivo || "";
        return movimentacao;
    };

    create = async (request: Request, response: Response): Promise<void> => {
        log.debug("create()");

        const funcionario = this.getFuncionarioLogado(request);
        const body = request.body.movimentacao;
        const movimentacao = this.montarMovimentacao(body);
        const resultado = await this.movimentacaoService.create(movimentacao, funcionario);
        StandardResponse.created("Movimentação registrada com sucesso", { movimentacoes: [resultado] }).send(response);
    };

    createLote = async (request: Request, response: Response): Promise<void> => {
        const funcionario = this.getFuncionarioLogado(request);
        const dados = request.body.movimentacoes;
        if (!Array.isArray(dados) || dados.length === 0) {
            StandardResponse.error("Adicione pelo menos um aluno à lista.", null, 400).send(response);
            return;
        }
        const movimentacoes = dados.map(item => this.montarMovimentacao(item));
        const resultado = await this.movimentacaoService.createLote(movimentacoes, funcionario);
        StandardResponse.created("Lista de movimentações registrada com sucesso", { movimentacoes: resultado }).send(response);
    };

    uploadArquivo = async (request: Request, response: Response): Promise<void> => {
        if (!request.file) { StandardResponse.error("Selecione uma imagem.", null, 400).send(response); return; }
        const id = String(request.params.id);
        const anterior = await this.movimentacaoService.buscar(id);
        if (!anterior || !(await this.movimentacaoService.anexar(id, request.file.filename))) {
            await fs.promises.unlink(request.file.path).catch(() => {});
            StandardResponse.notFound("Movimentação não encontrada.").send(response); return;
        }
        if (anterior.nomeArquivo) await fs.promises.unlink(path.resolve(__dirname, "../../uploads/movimentacao", path.basename(anterior.nomeArquivo))).catch(() => {});
        StandardResponse.success("Imagem anexada com sucesso", {}).send(response);
    };

    obterArquivo = async (request: Request, response: Response): Promise<void> => {
        const item = await this.movimentacaoService.buscar(String(request.params.id));
        if (!item?.nomeArquivo) { StandardResponse.notFound("Imagem não encontrada.").send(response); return; }
        response.sendFile(path.resolve(__dirname, "../../uploads/movimentacao", path.basename(item.nomeArquivo)));
    };

    findAll = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAll()", { data: request.query.data });

        const valorData = request.query.data;
        let data: Date | undefined;
        if (valorData !== undefined) {
            if (typeof valorData !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valorData)) {
                StandardResponse.error("Data inválida. Use o formato AAAA-MM-DD.", null, 400).send(response);
                return;
            }
            const [ano, mes, dia] = valorData.split("-").map(Number);
            data = new Date(Date.UTC(ano, mes - 1, dia));
            if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
                StandardResponse.error("Data inválida. Use o formato AAAA-MM-DD.", null, 400).send(response);
                return;
            }
        }

        const movimentacoes = await this.movimentacaoService.findAll(data);
        StandardResponse.success("Busca realizada com sucesso", { movimentacoes }).send(response);
    };
}