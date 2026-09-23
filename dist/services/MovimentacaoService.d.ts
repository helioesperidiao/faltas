import { Movimentacao } from "../models/Movimentacao";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { Funcionario } from "../models/Funcionario";
export declare class MovimentacaoService {
    private readonly movimentacaoDAO;
    constructor(movimentacaoDAO: MovimentacaoDAO);
    create(movimentacao: Movimentacao, funcionario: Funcionario): Promise<Movimentacao>;
    findAll(): Promise<Movimentacao[]>;
}
//# sourceMappingURL=MovimentacaoService.d.ts.map