"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Funcionario = void 0;
const mongodb_1 = require("mongodb");
const Cargo_1 = require("./Cargo");
const Auditoria_1 = require("./Auditoria");
class Funcionario {
    _idFuncionario = '';
    _cargo;
    _nomeFuncionario = '';
    _email = '';
    _senha = '';
    _recebeValeTransporte = 0;
    _auditoria = new Auditoria_1.Auditoria();
    constructor() {
        this._cargo = new Cargo_1.Cargo();
        console.log("⬆️  Funcionario.constructor()");
    }
    get idFuncionario() {
        return this._idFuncionario;
    }
    set idFuncionario(value) {
        if (!value) {
            throw new Error("idFuncionario é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idFuncionario inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idFuncionario = value;
    }
    get cargo() {
        return this._cargo;
    }
    set cargo(value) {
        if (!(value instanceof Cargo_1.Cargo)) {
            throw new Error("cargo deve ser uma instância válida de Cargo.");
        }
        this._cargo = value;
    }
    get nomeFuncionario() {
        return this._nomeFuncionario;
    }
    set nomeFuncionario(value) {
        if (typeof value !== "string") {
            throw new Error("nomeFuncionario deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeFuncionario deve ter pelo menos 3 caracteres.");
        }
        this._nomeFuncionario = nome;
    }
    get email() {
        return this._email;
    }
    set email(value) {
        if (typeof value !== "string") {
            throw new Error("email deve ser uma string.");
        }
        const emailTrimmed = value.trim();
        if (emailTrimmed === "") {
            throw new Error("email não pode ser vazio.");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            throw new Error("email em formato inválido.");
        }
        this._email = emailTrimmed;
    }
    get senha() {
        return this._senha;
    }
    set senha(value) {
        this._senha = value;
    }
    get recebeValeTransporte() {
        return this._recebeValeTransporte;
    }
    set recebeValeTransporte(value) {
        if (![0, 1].includes(value)) {
            throw new Error("recebeValeTransporte deve ser 0 ou 1.");
        }
        this._recebeValeTransporte = value;
    }
    get auditoria() {
        return this._auditoria;
    }
    set auditoria(value) {
        this._auditoria = value;
    }
    marcarCriadoPor(idFuncionario) {
        this._auditoria.marcarCriadoPor(idFuncionario);
    }
    marcarAlteradoPor(idFuncionario) {
        this._auditoria.marcarAlteradoPor(idFuncionario);
    }
    marcarDeletadoPor(idFuncionario) {
        this._auditoria.marcarDeletadoPor(idFuncionario);
    }
    isDeletado() {
        return this._auditoria.isDeletado();
    }
    toJSON() {
        return {
            idFuncionario: this._idFuncionario,
            nomeFuncionario: this._nomeFuncionario,
            email: this._email,
            recebeValeTransporte: this._recebeValeTransporte,
            cargo: this._cargo,
            auditoria: this._auditoria
        };
    }
}
exports.Funcionario = Funcionario;
//# sourceMappingURL=Funcionario.js.map