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
    async findAll() {
        return this.movimentacaoDAO.findAll();
    }
}
exports.MovimentacaoService = MovimentacaoService;
//# sourceMappingURL=MovimentacaoService.js.map