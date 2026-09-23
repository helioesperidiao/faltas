"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeHorario = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class GradeHorario {
    _idGradeHorario = '';
    _turma = '';
    _horaInicio = 0;
    _horaFim = 0;
    _dia = '';
    _cod = '';
    _disciplina = '';
    _auditoria = new Auditoria_1.Auditoria();
    constructor() {
        console.log("⬆️  GradeHorario.constructor()");
    }
    get idGradeHorario() {
        return this._idGradeHorario;
    }
    set idGradeHorario(value) {
        if (!value) {
            throw new Error("idGradeHorario é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idGradeHorario inválido: "${value}".`);
        }
        this._idGradeHorario = value;
    }
    get turma() {
        return this._turma;
    }
    set turma(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("turma é obrigatória.");
        }
        if (value.trim().length > 20) {
            throw new Error("turma pode ter no máximo 20 caracteres.");
        }
        this._turma = value.trim();
    }
    get horaInicio() {
        return this._horaInicio;
    }
    set horaInicio(value) {
        if (!GradeHorario.isHorarioValido(value)) {
            throw new Error(`horaInicio inválido: "${value}". Use hora inteira ou formato HHMM.`);
        }
        this._horaInicio = value;
    }
    get horaFim() {
        return this._horaFim;
    }
    set horaFim(value) {
        if (!GradeHorario.isHorarioValido(value)) {
            throw new Error(`horaFim inválido: "${value}". Use hora inteira ou formato HHMM.`);
        }
        this._horaFim = value;
    }
    static isHorarioValido(value) {
        if (!Number.isInteger(value) || value < 0)
            return false;
        if (value <= 23)
            return true;
        const minutos = value % 100;
        return value <= 2359 && minutos < 60;
    }
    get dia() {
        return this._dia;
    }
    set dia(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("dia é obrigatório.");
        }
        if (value.trim().length > 20) {
            throw new Error("dia pode ter no máximo 20 caracteres.");
        }
        this._dia = value.trim();
    }
    get cod() {
        return this._cod;
    }
    set cod(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("cod é obrigatório.");
        }
        if (value.trim().length > 20) {
            throw new Error("cod pode ter no máximo 20 caracteres.");
        }
        this._cod = value.trim();
    }
    get disciplina() {
        return this._disciplina;
    }
    set disciplina(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("disciplina é obrigatória.");
        }
        if (value.trim().length > 100) {
            throw new Error("disciplina pode ter no máximo 100 caracteres.");
        }
        this._disciplina = value.trim();
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
            idGradeHorario: this._idGradeHorario,
            turma: this._turma,
            horaInicio: this._horaInicio,
            horaFim: this._horaFim,
            dia: this._dia,
            cod: this._cod,
            disciplina: this._disciplina,
            auditoria: this._auditoria
        };
    }
}
exports.GradeHorario = GradeHorario;
//# sourceMappingURL=GradeHorario.js.map