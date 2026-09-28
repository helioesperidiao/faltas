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
    findAll = async (request, response) => {
        const valorData = request.query.data;
        let data;
        if (valorData !== undefined) {
            if (typeof valorData !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valorData)) {
                StandardResponse_1.StandardResponse.error("Data inválida. Use o formato AAAA-MM-DD.", null, 400).send(response);
                return;
            }
            const [ano, mes, dia] = valorData.split("-").map(Number);
            data = new Date(ano, mes - 1, dia);
            if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
                StandardResponse_1.StandardResponse.error("Data inválida. Use o formato AAAA-MM-DD.", null, 400).send(response);
                return;
            }
        }
        const movimentacoes = await this.movimentacaoService.findAll(data);
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", { movimentacoes }).send(response);
    };
}
exports.MovimentacaoController = MovimentacaoController;
//# sourceMappingURL=MovimentacaoController.js.map