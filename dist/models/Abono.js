"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Abono = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class Abono {
    _idAbono = '';
    _matricula = '';
    _alunoNome = '';
    _turma = '';
    _curso = '';
    _serie = '';
    _dataInicio = new Date();
    _dataFim = new Date();
    _motivo = '';
    _nomeArquivo = '';
    _status = 'Pendente';
    _aprovadoPor = '';
    _auditoria = new Auditoria_1.Auditoria();
    constructor() {
        console.log("⬆️  Abono.constructor()");
    }
    get idAbono() {
        return this._idAbono;
    }
    set idAbono(value) {
        if (!value) {
            throw new Error("idAbono é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idAbono inválido: "${value}".`);
        }
        this._idAbono = value;
    }
    get matricula() {
        return this._matricula;
    }
    set matricula(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("matricula é obrigatória.");
        }
        if (value.trim().length > 8) {
            throw new Error("matricula pode ter no máximo 8 caracteres.");
        }
        this._matricula = value.trim();
    }
    get alunoNome() { return this._alunoNome; }
    set alunoNome(value) { this._alunoNome = (value || '').trim(); }
    get turma() { return this._turma; }
    set turma(value) { this._turma = (value || '').trim(); }
    get curso() { return this._curso; }
    set curso(value) { this._curso = (value || '').trim(); }
    get serie() { return this._serie; }
    set serie(value) { this._serie = (value || '').trim(); }
    get dataInicio() {
        return this._dataInicio;
    }
    set dataInicio(value) {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            throw new Error(`dataInicio inválida: "${value}".`);
        }
        this._dataInicio = value;
    }
    get dataFim() {
        return this._dataFim;
    }
    set dataFim(value) {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            throw new Error(`dataFim inválida: "${value}".`);
        }
        this._dataFim = value;
    }
    get motivo() {
        return this._motivo;
    }
    set motivo(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("motivo é obrigatório.");
        }
        if (value.trim().length > 512) {
            throw new Error("motivo pode ter no máximo 512 caracteres.");
        }
        this._motivo = value.trim();
    }
    get nomeArquivo() {
        return this._nomeArquivo;
    }
    set nomeArquivo(value) {
        if (typeof value !== "string") {
            throw new Error("nomeArquivo deve ser uma string.");
        }
        if (value.trim().length > 255) {
            throw new Error("nomeArquivo deve ter no máximo 255 caracteres.");
        }
        this._nomeArquivo = value.trim();
    }
    get status() {
        return this._status;
    }
    set status(value) {
        const permitidos = ["Pendente", "Aprovado", "Rejeitado"];
        if (!permitidos.includes(value)) {
            throw new Error(`status inválido: "${value}". Deve ser uma de: ${permitidos.join(", ")}.`);
        }
        this._status = value;
    }
    get aprovadoPor() {
        return this._aprovadoPor;
    }
    set aprovadoPor(value) {
        this._aprovadoPor = (value || '').trim();
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
            idAbono: this._idAbono,
            matricula: this._matricula,
            alunoNome: this._alunoNome,
            turma: this._turma,
            curso: this._curso,
            serie: this._serie,
            dataInicio: this._dataInicio,
            dataFim: this._dataFim,
            motivo: this._motivo,
            nomeArquivo: this._nomeArquivo,
            status: this._status,
            aprovadoPor: this._aprovadoPor,
            auditoria: this._auditoria
        };
    }
}
exports.Abono = Abono;
//# sourceMappingURL=Abono.js.map