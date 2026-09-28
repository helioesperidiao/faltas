"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movimentacao = exports.HORARIOS_MOVIMENTACAO = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
exports.HORARIOS_MOVIMENTACAO = ["07:50", "08:40", "09:50", "10:40", "11:40"];
class Movimentacao {
    _idMovimentacao = "";
    _nomeAluno = "";
    _matricula = "";
    _data = new Date();
    _horario = "";
    _tipo = "entrada";
    _auditoria = new Auditoria_1.Auditoria();
    get idMovimentacao() { return this._idMovimentacao; }
    set idMovimentacao(value) {
        if (!value || !mongodb_1.ObjectId.isValid(value))
            throw new Error("idMovimentacao inválido.");
        this._idMovimentacao = value;
    }
    get nomeAluno() { return this._nomeAluno; }
    set nomeAluno(value) {
        if (typeof value !== "string" || !value.trim())
            throw new Error("nomeAluno é obrigatório.");
        this._nomeAluno = value.trim();
    }
    get matricula() { return this._matricula; }
    set matricula(value) {
        if (typeof value !== "string" || !value.trim())
            throw new Error("matricula é obrigatória.");
        this._matricula = value.trim();
    }
    get data() { return this._data; }
    set data(value) {
        if (!(value instanceof Date) || isNaN(value.getTime()))
            throw new Error("data inválida.");
        this._data = value;
    }
    get horario() { return this._horario; }
    set horario(value) {
        if (typeof value !== "string" || !exports.HORARIOS_MOVIMENTACAO.includes(value)) {
            throw new Error("horário inválido. Use um dos horários oficiais de entrada ou saída.");
        }
        this._horario = value;
    }
    get tipo() { return this._tipo; }
    set tipo(value) {
        if (value !== "entrada" && value !== "saida")
            throw new Error("tipo deve ser entrada ou saida.");
        this._tipo = value;
    }
    get auditoria() { return this._auditoria; }
    set auditoria(value) { this._auditoria = value; }
    marcarCriadoPor(idFuncionario) { this._auditoria.marcarCriadoPor(idFuncionario); }
    toJSON() {
        return {
            idMovimentacao: this._idMovimentacao,
            nomeAluno: this._nomeAluno,
            matricula: this._matricula,
            data: this._data.toISOString(),
            horario: this._horario,
            tipo: this._tipo,
            auditoria: this._auditoria.toJSON()
        };
    }
}
exports.Movimentacao = Movimentacao;
//# sourceMappingURL=Movimentacao.js.map