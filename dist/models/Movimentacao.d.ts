import { Auditoria } from "./Auditoria";
export type TipoMovimentacao = "entrada" | "saida";
export declare const HORARIOS_MOVIMENTACAO: readonly ["07:50", "08:40", "09:50", "10:40", "11:40"];
export declare class Movimentacao {
    private _idMovimentacao;
    private _nomeAluno;
    private _matricula;
    private _data;
    private _horario;
    private _tipo;
    private _auditoria;
    get idMovimentacao(): string;
    set idMovimentacao(value: string);
    get nomeAluno(): string;
    set nomeAluno(value: string);
    get matricula(): string;
    set matricula(value: string);
    get data(): Date;
    set data(value: Date);
    get horario(): string;
    set horario(value: string);
    get tipo(): TipoMovimentacao;
    set tipo(value: TipoMovimentacao);
    get auditoria(): Auditoria;
    set auditoria(value: Auditoria);
    marcarCriadoPor(idFuncionario: string): void;
    toJSON(): {
        idMovimentacao: string;
        nomeAluno: string;
        matricula: string;
        data: string;
        horario: string;
        tipo: TipoMovimentacao;
        auditoria: {
            criadoPor: string;
            criadoEm: string;
            alteradoPor: string;
            alteradoEm: string | null;
            deletadoPor: string;
            deletadoEm: string | null;
        };
    };
}
//# sourceMappingURL=Movimentacao.d.ts.map