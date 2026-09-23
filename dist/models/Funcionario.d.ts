import { Cargo } from "./Cargo";
import { Auditoria } from "./Auditoria";
export declare class Funcionario {
    private _idFuncionario;
    private _cargo;
    private _nomeFuncionario;
    private _email;
    private _senha;
    private _recebeValeTransporte;
    private _auditoria;
    constructor();
    get idFuncionario(): string;
    set idFuncionario(value: string);
    get cargo(): Cargo;
    set cargo(value: Cargo);
    get nomeFuncionario(): string;
    set nomeFuncionario(value: string);
    get email(): string;
    set email(value: string);
    get senha(): string;
    set senha(value: string);
    get recebeValeTransporte(): number;
    set recebeValeTransporte(value: number);
    get auditoria(): Auditoria;
    set auditoria(value: Auditoria);
    marcarCriadoPor(idFuncionario: string): void;
    marcarAlteradoPor(idFuncionario: string): void;
    marcarDeletadoPor(idFuncionario: string): void;
    isDeletado(): boolean;
    toJSON(): {
        idFuncionario: string;
        nomeFuncionario: string;
        email: string;
        recebeValeTransporte: number;
        cargo: Cargo;
        auditoria: Auditoria;
    };
}
//# sourceMappingURL=Funcionario.d.ts.map