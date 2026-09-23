import { Request, Response } from "express";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { Movimentacao } from "../models/Movimentacao";
import { StandardResponse } from "../http/StandardResponse";
import { BaseController } from "./BaseController";

export class MovimentacaoController extends BaseController {
    constructor(private readonly movimentacaoService: MovimentacaoService) { super(); }

    create = async (request: Request, response: Response): Promise<void> => {
        const funcionario = this.getFuncionarioLogado(request);
        const body = request.body.movimentacao;
        const movimentacao = new Movimentacao();
        movimentacao.nomeAluno = body.nomeAluno;
        movimentacao.matricula = body.matricula;
        const [ano, mes, dia] = body.data.split("-").map(Number);
        movimentacao.data = new Date(ano, mes - 1, dia);
        movimentacao.horario = body.horario;
        movimentacao.tipo = body.tipo;
        const resultado = await this.movimentacaoService.create(movimentacao, funcionario);
        StandardResponse.created("Movimentação registrada com sucesso", { movimentacoes: [resultado] }).send(response);
    };

    findAll = async (_request: Request, response: Response): Promise<void> => {
        const movimentacoes = await this.movimentacaoService.findAll();
        StandardResponse.success("Busca realizada com sucesso", { movimentacoes }).send(response);
    };
}
