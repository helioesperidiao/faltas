import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Funcionario } from '@/models/Funcionario';
import { Cargo } from '@/models/Cargo';

export class MeuTokenJWT {
    private _key: string;
    private _alg: string;
    private _type: string;
    private _iss: string;
    private _aud: string;
    private _sub: string;
    private _duracaoToken: number;

    constructor() {
        this._key = "x9S4q0v+V0IjvHkG20uAxaHx1ijj+q1HWjHKv+ohxp/oK+77qyXkVj/l4QYHHTF3";
        this._alg = "HS256";
        this._type = "JWT";
        this._iss = "http://localhost";
        this._aud = "http://localhost";
        this._sub = "acesso_sistema";
        this._duracaoToken = 3600 * 24 * 60;
    }

    /**
     * Gera um token JWT a partir de um objeto Funcionario.
     */
    gerarToken = (funcionario: Funcionario): string => {
        console.log ("🔷  MeuTokenJWT.gerarToken()");
        const headers = {
            alg: this._alg,
            typ: this._type,
        };

        const payload = {
            iss: this._iss,
            aud: this._aud,
            sub: this._sub,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this._duracaoToken,
            nbf: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(16).toString("hex"),
            email: funcionario.email,
            cargo: { idCargo: funcionario.cargo.idCargo },
            name: funcionario.nomeFuncionario,
            idFuncionario: funcionario.idFuncionario
        };

        return jwt.sign(payload, this._key, {
            algorithm: this._alg as jwt.Algorithm,
            header: headers,
        });
    };

    /**
     * Valida um token JWT e retorna um objeto Funcionario se válido, ou null.
     */
    validarToken = (stringToken: string): Funcionario | null => {
        console.log ("🔷  MeuTokenJWT.validarToken()");
        if (!stringToken || stringToken.trim() === "") {
            console.error("Token não fornecido ou vazio");
            return null;
        }

        const token = stringToken.replace("Bearer ", "").trim();

        try {
            const decoded: any = jwt.verify(token, this._key, {
                algorithms: [this._alg as jwt.Algorithm],
            });

           // console.log(decoded);

            const cargo = new Cargo();
            if (decoded.role) {
                cargo.nomeCargo = decoded.role;
            }

            const funcionario = new Funcionario();
            console.log(decoded.idFuncionario);
            funcionario.idFuncionario = decoded.idFuncionario;
            funcionario.email = decoded.email;
            funcionario.nomeFuncionario = decoded.name || '';
            funcionario.cargo = cargo;

            return funcionario;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                console.error("Token expirado");
            } else if (err instanceof jwt.JsonWebTokenError) {
                console.error("Token inválido");
            } else {
                console.error("Erro geral", err);
            }
            return null;
        }
    };

    // Getters e Setters
    get key(): string { return this._key; }
    set key(value: string) { this._key = value; }

    get alg(): string { return this._alg; }
    set alg(value: string) { this._alg = value; }

    get type(): string { return this._type; }
    set type(value: string) { this._type = value; }

    get iss(): string { return this._iss; }
    set iss(value: string) { this._iss = value; }

    get aud(): string { return this._aud; }
    set aud(value: string) { this._aud = value; }

    get sub(): string { return this._sub; }
    set sub(value: string) { this._sub = value; }

    get duracaoToken(): number { return this._duracaoToken; }
    set duracaoToken(value: number) { this._duracaoToken = value; }
}