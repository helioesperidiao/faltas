"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeHorario = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class GradeHorario {
    _idGradeHorario = '';
    _turma = '';
    _horaInicio = '';
    _horaFim = '';
    _dia = '';
    _cod = '';
    _disciplina = '';
    _duracaoAulaMinutos = 0;
    _cargaHorariaSemanalMinutos = 0;
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
        this._horaInicio = this.normalizarHorario(value, "horaInicio");
    }
    get horaFim() {
        return this._horaFim;
    }
    set horaFim(value) {
        this._horaFim = this.normalizarHorario(value, "horaFim");
    }
    get duracaoAulaMinutos() {
        return this._duracaoAulaMinutos;
    }
    set duracaoAulaMinutos(value) {
        if (!Number.isInteger(value) || value <= 0 || value > 24 * 60) {
            throw new Error("duracaoAulaMinutos deve ser um número inteiro positivo.");
        }
        this._duracaoAulaMinutos = value;
    }
    get cargaHorariaSemanalMinutos() {
        return this._cargaHorariaSemanalMinutos;
    }
    set cargaHorariaSemanalMinutos(value) {
        if (!Number.isInteger(value) || value <= 0 || value > 7 * 24 * 60) {
            throw new Error("cargaHorariaSemanalMinutos deve ser um número inteiro positivo.");
        }
        this._cargaHorariaSemanalMinutos = value;
    }
    static calcularDuracaoMinutos(horaInicio, horaFim) {
        const inicio = GradeHorario.horarioParaMinutos(horaInicio);
        const fim = GradeHorario.horarioParaMinutos(horaFim);
        const duracao = fim - inicio;
        if (duracao <= 0) {
            throw new Error("horaFim deve ser posterior a horaInicio.");
        }
        return duracao;
    }
    static horarioParaMinutos(value) {
        if (typeof value === "number") {
            if (isNaN(value) || value < 0 || value >= 24) {
                throw new Error(`horário inválido: "${value}".`);
            }
            return value > 0 && value < 1 ? Math.round(value * 24 * 60) : Math.round(value * 60);
        }
        const texto = String(value || '').trim().toLowerCase().replace('h', ':');
        const correspondencia = texto.match(/^(\d{1,2})(?::(\d{1,2})(?::\d{1,2})?)?$/);
        if (!correspondencia) {
            throw new Error(`horário inválido: "${value}".`);
        }
        const hora = Number(correspondencia[1]);
        const minuto = Number(correspondencia[2] || 0);
        if (hora >= 24 || minuto >= 60) {
            throw new Error(`horário inválido: "${value}".`);
        }
        return hora * 60 + minuto;
    }
    normalizarHorario(value, campo) {
        if (typeof value === "number") {
            if (isNaN(value) || value < 0 || value >= 24) {
                throw new Error(`${campo} inválido: "${value}".`);
            }
            const minutos = value > 0 && value < 1 ? Math.round(value * 24 * 60) : Math.round(value * 60);
            return this.formatarMinutos(minutos, campo);
        }
        const texto = String(value || '').trim().toLowerCase().replace('h', ':');
        const correspondencia = texto.match(/^(\d{1,2})(?::(\d{1,2})(?::\d{1,2})?)?$/);
        if (!correspondencia) {
            throw new Error(`${campo} inválido: "${value}". Use formatos como 7, 07:00 ou 07h30.`);
        }
        const hora = Number(correspondencia[1]);
        const minuto = Number(correspondencia[2] || 0);
        if (minuto >= 60) {
            throw new Error(`${campo} inválido: "${value}".`);
        }
        return this.formatarMinutos(hora * 60 + minuto, campo);
    }
    formatarMinutos(minutos, campo) {
        if (minutos < 0 || minutos >= 24 * 60) {
            throw new Error(`${campo} inválido.`);
        }
        const hora = Math.floor(minutos / 60);
        const minuto = minutos % 60;
        return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
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
            duracaoAulaMinutos: this._duracaoAulaMinutos,
            cargaHorariaSemanalMinutos: this._cargaHorariaSemanalMinutos,
            auditoria: this._auditoria
        };
    }
}
exports.GradeHorario = GradeHorario;
//# sourceMappingURL=GradeHorario.js.map