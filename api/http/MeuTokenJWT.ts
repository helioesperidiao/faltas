import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Interface que define os claims esperados no payload do token.
 */
interface Claims {
    email: string;
    role: string | null;
    name: string | null;
    idFuncionario: string;
}

/**
 * Interface que define a estrutura do payload decodificado.
 * Estende os claims e inclui campos padrão do JWT.
 */
interface DecodedPayload extends Claims {
    iss: string;
    aud: string;
    sub: string;
    iat: number;
    exp: number;
    nbf: number;
    jti: string;
}

/**
 * Classe responsável por gerar e validar tokens JWT (JSON Web Token) para autenticação.
 * 
 * Implementa:
 * - Geração de token com claims personalizados;
 * - Validação de token, incluindo verificação de expiração;
 * - Configuração de cabeçalhos e payload do JWT.
 * 
 * Os atributos principais são privados e podem ser acessados/modificados via getters/setters.
 */
export class MeuTokenJWT {
    private _key: string;
    private _alg: string;
    private _type: string;
    private _iss: string;
    private _aud: string;
    private _sub: string;
    private _duracaoToken: number;
    private _payload: DecodedPayload | null;

    /**
     * Construtor da classe MeuTokenJWT
     * Inicializa valores padrão como chave secreta, algoritmo, tipo e duração do token.
     */
    constructor() {
        this._key = "x9S4q0v+V0IjvHkG20uAxaHx1ijj+q1HWjHKv+ohxp/oK+77qyXkVj/l4QYHHTF3";
        this._alg = "HS256";
        this._type = "JWT";
        this._iss = "http://localhost";
        this._aud = "http://localhost";
        this._sub = "acesso_sistema";
        this._duracaoToken = 3600 * 24 * 60; // 60 dias em segundos
        this._payload = null;
    }

    /**
     * Gera um token JWT assinado com os claims fornecidos.
     * @param {Claims} claims - Objeto com informações do usuário: { email, role, name, idFuncionario }
     * @returns {string} Token JWT assinado
     */
    gerarToken = (claims: Claims): string => {
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

            email: claims.email,
            role: claims.role,
            name: claims.name,
            idFuncionario: claims.idFuncionario
        };

        return jwt.sign(payload, this._key, {
            algorithm: this._alg as jwt.Algorithm,
            header: headers,
        });
    };

    /**
     * Valida um token JWT.
     * @param {string} stringToken - Token JWT a ser validado (pode incluir prefixo "Bearer ")
     * @returns {boolean} true se o token for válido, false caso contrário
     * 
     * Armazena o payload decodificado em _payload se a validação for bem-sucedida.
     */
    validarToken = (stringToken: string): boolean => {
        if (!stringToken) {
            console.error("Token não fornecido");
            return false;
        }

        if (stringToken.trim() === "") {
            console.error("Token em branco");
            return false;
        }

        const token = stringToken.replace("Bearer ", "").trim();

        try {
            const decoded = jwt.verify(token, this._key, {
                algorithms: [this._alg as jwt.Algorithm],
            }) as DecodedPayload;
            this._payload = decoded;
            return true;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                console.error("Token expirado");
            } else if (err instanceof jwt.JsonWebTokenError) {
                console.error("Token inválido");
            } else {
                console.error("Erro geral", err);
            }
            return false;
        }
    };

    // Getters e Setters para atributos privados

    get key(): string {
        return this._key;
    }

    set key(value: string) {
        this._key = value;
    }

    get alg(): string {
        return this._alg;
    }

    set alg(value: string) {
        this._alg = value;
    }

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }

    get iss(): string {
        return this._iss;
    }

    set iss(value: string) {
        this._iss = value;
    }

    get aud(): string {
        return this._aud;
    }

    set aud(value: string) {
        this._aud = value;
    }

    get sub(): string {
        return this._sub;
    }

    set sub(value: string) {
        this._sub = value;
    }

    get duracaoToken(): number {
        return this._duracaoToken;
    }

    set duracaoToken(value: number) {
        this._duracaoToken = value;
    }

    get payload(): DecodedPayload | null {
        return this._payload;
    }

    set payload(value: DecodedPayload | null) {
        this._payload = value;
    }
}