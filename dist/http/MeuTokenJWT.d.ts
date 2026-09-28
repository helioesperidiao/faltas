import { Funcionario } from '@/models/Funcionario';
export declare class MeuTokenJWT {
    private _key;
    private _alg;
    private _type;
    private _iss;
    private _aud;
    private _sub;
    private _duracaoToken;
    constructor();
    gerarToken: (funcionario: Funcionario) => string;
    validarToken: (stringToken: string) => Funcionario | null;
    get key(): string;
    set key(value: string);
    get alg(): string;
    set alg(value: string);
    get type(): string;
    set type(value: string);
    get iss(): string;
    set iss(value: string);
    get aud(): string;
    set aud(value: string);
    get sub(): string;
    set sub(value: string);
    get duracaoToken(): number;
    set duracaoToken(value: number);
}
//# sourceMappingURL=MeuTokenJWT.d.ts.map