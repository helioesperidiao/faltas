import { Auditoria } from "./Auditoria";
export declare class Cargo {
    private _idCargo;
    private _nomeCargo;
    private _auditoria;
    constructor();
    get idCargo(): string;
    set idCargo(value: string);
    get nomeCargo(): string;
    set nomeCargo(value: string);
    get auditoria(): Auditoria;
    set auditoria(value: Auditoria);
    marcarCriadoPor(idFuncionario: string): void;
    marcarAlteradoPor(idFuncionario: string): void;
    marcarDeletadoPor(idFuncionario: string): void;
    isDeletado(): boolean;
    toJSON(): {
        idCargo: string;
        nomeCargo: string;
        auditoria: Auditoria;
    };
}
//# sourceMappingURL=Cargo.d.ts.map