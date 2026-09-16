export declare class Auditoria {
    private _criadoPor;
    private _criadoEm;
    private _alteradoPor;
    private _alteradoEm;
    private _deletadoPor;
    private _deletadoEm;
    get criadoPor(): string;
    set criadoPor(value: string);
    get criadoEm(): Date;
    set criadoEm(value: Date);
    get alteradoPor(): string;
    set alteradoPor(value: string);
    get alteradoEm(): Date | null;
    set alteradoEm(value: Date | null);
    get deletadoPor(): string;
    set deletadoPor(value: string);
    get deletadoEm(): Date | null;
    set deletadoEm(value: Date | null);
    marcarCriadoPor(idFuncionario: string): void;
    marcarAlteradoPor(idFuncionario: string): void;
    marcarDeletadoPor(idFuncionario: string): void;
    isDeletado(): boolean;
    toJSON(): {
        criadoPor: string;
        criadoEm: string;
        alteradoPor: string;
        alteradoEm: string | null;
        deletadoPor: string;
        deletadoEm: string | null;
    };
}
//# sourceMappingURL=Auditoria.d.ts.map