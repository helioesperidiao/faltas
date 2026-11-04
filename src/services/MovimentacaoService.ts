import { Movimentacao } from "../models/Movimentacao";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { Funcionario } from "../models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("MovimentacaoService");

export class MovimentacaoService {
    constructor(private readonly movimentacaoDAO: MovimentacaoDAO) {}

    async create(movimentacao: Movimentacao, funcionario: Funcionario): Promise<Movimentacao> {
        log.debug("create()", { matricula: movimentacao.matricula, tipo: movimentacao.tipo });
        const criada = await this.movimentacaoDAO.create(movimentacao, funcionario);
        log.info("movimentação registrada", {
            idMovimentacao: criada.idMovimentacao,
            matricula: criada.matricula,
            tipo: criada.tipo,
            registradaPor: funcionario.email,
        });
        return criada;
    }

    async createLote(movimentacoes: Movimentacao[], funcionario: Funcionario): Promise<Movimentacao[]> {
        return this.movimentacaoDAO.createLote(movimentacoes, funcionario);
    }

    async findAll(data?: Date): Promise<Movimentacao[]> {
        log.debug("findAll()", { data });
        return this.movimentacaoDAO.findAll(data);
    }
}