"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoController = void 0;
const Movimentacao_1 = require("../models/Movimentacao");
const StandardResponse_1 = require("../http/StandardResponse");
const BaseController_1 = require("./BaseController");
class MovimentacaoController extends BaseController_1.BaseController {
    movimentacaoService;
    constructor(movimentacaoService) {
        super();
        this.movimentacaoService = movimentacaoService;
    }
    create = async (request, response) => {
        const funcionario = this.getFuncionarioLogado(request);
        const body = request.body.movimentacao;
        const movimentacao = new Movimentacao_1.Movimentacao();
        movimentacao.nomeAluno = body.nomeAluno;
        movimentacao.matricula = body.matricula;
        const [ano, mes, dia] = body.data.split("-").map(Number);
        movimentacao.data = new Date(ano, mes - 1, dia);
        movimentacao.horario = body.horario;
        movimentacao.tipo = body.tipo;
        const resultado = await this.movimentacaoService.create(movimentacao, funcionario);
        StandardResponse_1.StandardResponse.created("Movimentação registrada com sucesso", { movimentacoes: [resultado] }).send(response);
    };
    findAll = async (_request, response) => {
        const movimentacoes = await this.movimentacaoService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", { movimentacoes }).send(response);
    };
}
exports.MovimentacaoController = MovimentacaoController;
//# sourceMappingURL=MovimentacaoController.js.map