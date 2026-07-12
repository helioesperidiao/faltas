import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Funcionario } from '@/models/Funcionario';
import { Cargo } from '@/models/Cargo';

/**
 * Classe responsável pela geração, validação e renovação de tokens JWT.
 * 
 * Utiliza o algoritmo HS256 e armazena claims personalizados do funcionário,
 * como id, email, nome e informações do cargo. A duração do token é configurável.
 * 
 * As configurações são carregadas a partir de variáveis de ambiente (`.env`),
 * com fallbacks para valores padrão seguros para desenvolvimento.
 * 
 * @example
 * // Criar instância e gerar token
 * const jwt = new MeuTokenJWT();
 * const token = jwt.gerarToken(funcionario);
 * 
 * // Validar token e obter funcionário
 * const funcionarioDecodificado = jwt.validarToken(tokenRecebido);
 * if (funcionarioDecodificado) {
 *   // token válido, prosseguir
 * }
 */
export class MeuTokenJWT {
    private _key: string;
    private _alg: string;
    private _type: string;
    private _iss: string;
    private _aud: string;
    private _sub: string;
    private _duracaoToken: number;

    /**
     * Construtor da classe MeuTokenJWT.
     * 
     * Carrega as configurações das variáveis de ambiente:
     * - `JWT_SECRET`: chave secreta (obrigatória, fallback para desenvolvimento)
     * - `JWT_ALGORITHM`: algoritmo (padrão: HS256)
     * - `JWT_TYPE`: tipo (padrão: JWT)
     * - `JWT_ISSUER`: emissor (padrão: http://localhost)
     * - `JWT_AUDIENCE`: audiência (padrão: http://localhost)
     * - `JWT_SUBJECT`: assunto (padrão: acesso_sistema)
     * - `JWT_EXPIRES_IN_SECONDS`: duração em segundos (padrão: 60 dias)
     */
    constructor() {
        // Carrega variáveis de ambiente (com fallbacks)
        this._key = process.env.JWT_SECRET || "x9S4q0v+V0IjvHkG20uAxaHx1ijj+q1HWjHKv+ohxp/oK+77qyXkVj/l4QYHHTF3";
        this._alg = process.env.JWT_ALGORITHM || "HS256";
        this._type = process.env.JWT_TYPE || "JWT";
        this._iss = process.env.JWT_ISSUER || "http://localhost";
        this._aud = process.env.JWT_AUDIENCE || "http://localhost";
        this._sub = process.env.JWT_SUBJECT || "acesso_sistema";
        this._duracaoToken = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '', 10) || (3600 * 24 * 60); // 60 dias

        console.log(`🔐 MeuTokenJWT configurado:
  Algoritmo: ${this._alg}
  Tipo: ${this._type}
  Emissor: ${this._iss}
  Audiência: ${this._aud}
  Assunto: ${this._sub}
  Duração: ${this._duracaoToken}s (${Math.round(this._duracaoToken / 86400)} dias)
  Chave: ${this._key ? '✅ definida' : '❌ não definida (use JWT_SECRET no .env)'}`);
    }

    /**
     * Gera um token JWT assinado a partir dos dados do funcionário.
     * 
     * Os claims incluem: emissor, audiência, assunto, timestamps (iat, exp, nbf),
     * e os dados do funcionário (email, cargo, nome, id).
     * 
     * @param {Funcionario} funcionario - Objeto Funcionario com os dados a serem codificados.
     * @returns {string} Token JWT assinado.
     * 
     * @example
     * const token = jwt.gerarToken(funcionario);
     */
    public gerarToken = (funcionario: Funcionario): string => {
        console.log("🔷  MeuTokenJWT.gerarToken()");
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
            cargo: {
                idCargo: funcionario.cargo.idCargo,
                nomeCargo: funcionario.cargo.nomeCargo
            },
            nomeFuncionario: funcionario.nomeFuncionario,
            idFuncionario: funcionario.idFuncionario
        };

        return jwt.sign(payload, this._key, {
            algorithm: this._alg as jwt.Algorithm,
            header: headers,
        });
    };

    /**
     * Valida um token JWT e o decodifica, retornando um objeto Funcionario.
     * 
     * O token pode conter o prefixo "Bearer " (removido automaticamente).
     * Em caso de erro (token inválido, expirado, formato incorreto), retorna null.
     * 
     * @param {string} stringToken - Token JWT a ser validado (pode incluir "Bearer ").
     * @returns {Funcionario | null} Objeto Funcionario decodificado ou null se inválido.
     * 
     * @example
     * const funcionario = jwt.validarToken(req.headers.authorization);
     * if (funcionario) {
     *   // token válido
     * } else {
     *   // token inválido
     * }
     */
    public validarToken = (stringToken: string): Funcionario | null => {
        console.log("🔷  MeuTokenJWT.validarToken()");
        if (!stringToken || stringToken.trim() === "") {
            console.error("Token não fornecido ou vazio");
            return null;
        }

        const token = stringToken.replace("Bearer ", "").trim();

        try {
            const decoded: any = jwt.verify(token, this._key, {
                algorithms: [this._alg as jwt.Algorithm],
            });

            const cargo = new Cargo();
            if (decoded.cargo) {
                cargo.nomeCargo = decoded.cargo.nomeCargo;
                cargo.idCargo = decoded.cargo.idCargo;
            }

            const funcionario = new Funcionario();
            console.log(decoded.idFuncionario);
            funcionario.idFuncionario = decoded.idFuncionario;
            funcionario.email = decoded.email;
            funcionario.nomeFuncionario = decoded.nomeFuncionario || '';
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

    // ======================== GETTERS E SETTERS ========================

    /** Chave secreta usada para assinar e verificar o token. */
    get key(): string { return this._key; }
    set key(value: string) { this._key = value; }

    /** Algoritmo de criptografia (ex: HS256). */
    get alg(): string { return this._alg; }
    set alg(value: string) { this._alg = value; }

    /** Tipo do token (ex: JWT). */
    get type(): string { return this._type; }
    set type(value: string) { this._type = value; }

    /** Emissor do token (claim 'iss'). */
    get iss(): string { return this._iss; }
    set iss(value: string) { this._iss = value; }

    /** Audiência (destinatário) do token (claim 'aud'). */
    get aud(): string { return this._aud; }
    set aud(value: string) { this._aud = value; }

    /** Assunto do token (claim 'sub'). */
    get sub(): string { return this._sub; }
    set sub(value: string) { this._sub = value; }

    /** Duração do token em segundos (padrão: 60 dias). */
    get duracaoToken(): number { return this._duracaoToken; }
    set duracaoToken(value: number) { this._duracaoToken = value; }
}