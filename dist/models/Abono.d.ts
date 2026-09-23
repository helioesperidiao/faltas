import { Auditoria } from "./Auditoria";
export declare class Abono {
    private _idAbono;
    private _matricula;
    private _dataInicio;
    private _dataFim;
    private _motivo;
    private _nomeArquivo;
    private _status;
    private _aprovadoPor;
    private _auditoria;
    constructor();
    get idAbono(): string;
    set idAbono(value: string);
    get matricula(): string;
    set matricula(value: string);
    get dataInicio(): Date;
    set dataInicio(value: Date);
    get dataFim(): Date;
    set dataFim(value: Date);
    get motivo(): string;
    set motivo(value: string);
    get nomeArquivo(): string;
    set nomeArquivo(value: string);
    get status(): string;
    set status(value: string);
    get aprovadoPor(): string;
    set aprovadoPor(value: string);
    get auditoria(): Auditoria;
    set auditoria(value: Auditoria);
    marcarCriadoPor(idFuncionario: string): void;
    marcarAlteradoPor(idFuncionario: string): void;
    marcarDeletadoPor(idFuncionario: string): void;
    isDeletado(): boolean;
    toJSON(): {
        idAbono: string;
        matricula: string;
        dataInicio: Date;
        dataFim: Date;
        motivo: string;
        nomeArquivo: string;
        status: string;
        aprovadoPor: string;
        auditoria: Auditoria;
    };
}
//# sourceMappingURL=Abono.d.ts.map