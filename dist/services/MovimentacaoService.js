"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoService = void 0;
class MovimentacaoService {
    movimentacaoDAO;
    constructor(movimentacaoDAO) {
        this.movimentacaoDAO = movimentacaoDAO;
    }
    async create(movimentacao, funcionario) {
        return this.movimentacaoDAO.create(movimentacao, funcionario);
    }
    async createLote(movimentacoes, funcionario) {
        return this.movimentacaoDAO.createLote(movimentacoes, funcionario);
    }
    async findAll(data) {
        return this.movimentacaoDAO.findAll(data);
    }
}
exports.MovimentacaoService = MovimentacaoService;
//# sourceMappingURL=MovimentacaoService.js.map