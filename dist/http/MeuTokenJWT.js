"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeuTokenJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const Funcionario_1 = require("@/models/Funcionario");
const Cargo_1 = require("@/models/Cargo");
class MeuTokenJWT {
    _key;
    _alg;
    _type;
    _iss;
    _aud;
    _sub;
    _duracaoToken;
    constructor() {
        this._key = process.env.JWT_SECRET || "x9S4q0v+V0IjvHkG20uAxaHx1ijj+q1HWjHKv+ohxp/oK+77qyXkVj/l4QYHHTF3";
        this._alg = process.env.JWT_ALGORITHM || "HS256";
        this._type = process.env.JWT_TYPE || "JWT";
        this._iss = process.env.JWT_ISSUER || "http://localhost";
        this._aud = process.env.JWT_AUDIENCE || "http://localhost";
        this._sub = process.env.JWT_SUBJECT || "acesso_sistema";
        this._duracaoToken = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '', 10) || (3600 * 24 * 60);
        console.log(`🔐 MeuTokenJWT configurado:
  Algoritmo: ${this._alg}
  Tipo: ${this._type}
  Emissor: ${this._iss}
  Audiência: ${this._aud}
  Assunto: ${this._sub}
  Duração: ${this._duracaoToken}s (${Math.round(this._duracaoToken / 86400)} dias)
  Chave: ${this._key ? '✅ definida' : '❌ não definida (use JWT_SECRET no .env)'}`);
    }
    gerarToken = (funcionario) => {
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
            jti: crypto_1.default.randomBytes(16).toString("hex"),
            email: funcionario.email,
            cargo: {
                idCargo: funcionario.cargo.idCargo,
                nomeCargo: funcionario.cargo.nomeCargo
            },
            nomeFuncionario: funcionario.nomeFuncionario,
            idFuncionario: funcionario.idFuncionario
        };
        return jsonwebtoken_1.default.sign(payload, this._key, {
            algorithm: this._alg,
            header: headers,
        });
    };
    validarToken = (stringToken) => {
        console.log("🔷  MeuTokenJWT.validarToken()");
        if (!stringToken || stringToken.trim() === "") {
            console.error("Token não fornecido ou vazio");
            return null;
        }
        const token = stringToken.replace("Bearer ", "").trim();
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this._key, {
                algorithms: [this._alg],
            });
            const cargo = new Cargo_1.Cargo();
            if (decoded.cargo) {
                cargo.nomeCargo = decoded.cargo.nomeCargo;
                cargo.idCargo = decoded.cargo.idCargo;
            }
            const funcionario = new Funcionario_1.Funcionario();
            console.log(decoded.idFuncionario);
            funcionario.idFuncionario = decoded.idFuncionario;
            funcionario.email = decoded.email;
            funcionario.nomeFuncionario = decoded.nomeFuncionario || '';
            funcionario.cargo = cargo;
            return funcionario;
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                console.error("Token expirado");
            }
            else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                console.error("Token inválido");
            }
            else {
                console.error("Erro geral", err);
            }
            return null;
        }
    };
    get key() { return this._key; }
    set key(value) { this._key = value; }
    get alg() { return this._alg; }
    set alg(value) { this._alg = value; }
    get type() { return this._type; }
    set type(value) { this._type = value; }
    get iss() { return this._iss; }
    set iss(value) { this._iss = value; }
    get aud() { return this._aud; }
    set aud(value) { this._aud = value; }
    get sub() { return this._sub; }
    set sub(value) { this._sub = value; }
    get duracaoToken() { return this._duracaoToken; }
    set duracaoToken(value) { this._duracaoToken = value; }
}
exports.MeuTokenJWT = MeuTokenJWT;
//# sourceMappingURL=MeuTokenJWT.js.map