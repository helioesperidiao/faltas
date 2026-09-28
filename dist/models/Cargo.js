"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cargo = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class Cargo {
    _idCargo = '';
    _nomeCargo = '';
    _auditoria = new Auditoria_1.Auditoria();
    constructor() {
        console.log("⬆️  Cargo.constructor()");
    }
    get idCargo() {
        return this._idCargo;
    }
    set idCargo(value) {
        if (!value) {
            throw new Error("idCargo é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idCargo inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idCargo = value;
    }
    get nomeCargo() {
        return this._nomeCargo;
    }
    set nomeCargo(value) {
        if (typeof value !== "string") {
            throw new Error("nomeCargo deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeCargo deve ter pelo menos 3 caracteres.");
        }
        if (nome.length > 64) {
            throw new Error("nomeCargo deve ter no máximo 64 caracteres.");
        }
        this._nomeCargo = nome;
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
            idCargo: this._idCargo,
            nomeCargo: this._nomeCargo,
            auditoria: this._auditoria
        };
    }
}
exports.Cargo = Cargo;
//# sourceMappingURL=Cargo.js.map