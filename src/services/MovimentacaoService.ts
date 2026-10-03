import { Movimentacao } from "../models/Movimentacao";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { Funcionario } from "../models/Funcionario";

export class MovimentacaoService {
    constructor(private readonly movimentacaoDAO: MovimentacaoDAO) {}

    async create(movimentacao: Movimentacao, funcionario: Funcionario): Promise<Movimentacao> {
        return this.movimentacaoDAO.create(movimentacao, funcionario);
    }

    async createLote(movimentacoes: Movimentacao[], funcionario: Funcionario): Promise<Movimentacao[]> {
        return this.movimentacaoDAO.createLote(movimentacoes, funcionario);
    }

    async findAll(data?: Date): Promise<Movimentacao[]> {
        return this.movimentacaoDAO.findAll(data);
    }
}
