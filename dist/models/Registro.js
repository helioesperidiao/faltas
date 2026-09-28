"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registro = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class Registro {
    _idRegistro = '';
    _ano = new Date().getFullYear();
    _codDisciplina = '';
    _horaInicio = 0;
    _horaFim = 0;
    _matricula = '';
    _alunoNome = '';
    _turma = '';
    _curso = '';
    _serie = '';
    _falta = false;
    _dia = new Date();
    _atrasado = 'Não';
    _nomeAcompanhante = '';
    _situacao = 'Normal';
    _auditoria = new Auditoria_1.Auditoria();
    constructor() {
        console.log("⬆️  Registro.constructor()");
    }
    get idRegistro() {
        return this._idRegistro;
    }
    set idRegistro(value) {
        if (!value) {
            throw new Error("idRegistro é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idRegistro inválido: "${value}".`);
        }
        this._idRegistro = value;
    }
    get ano() {
        return this._ano;
    }
    set ano(value) {
        if (typeof value !== "number" || isNaN(value)) {
            throw new Error("ano deve ser um número.");
        }
        if (value < 2000 || value > 2100) {
            throw new Error(`ano inválido: "${value}".`);
        }
        this._ano = value;
    }
    get codDisciplina() {
        return this._codDisciplina;
    }
    set codDisciplina(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("codDisciplina é obrigatório.");
        }
        this._codDisciplina = value.trim();
    }
    get horaInicio() {
        return this._horaInicio;
    }
    set horaInicio(value) {
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`horaInicio inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaInicio = value;
    }
    get horaFim() {
        return this._horaFim;
    }
    set horaFim(value) {
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`horaFim inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaFim = value;
    }
    get matricula() {
        return this._matricula;
    }
    set matricula(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("matricula é obrigatória.");
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
    get falta() {
        return this._falta;
    }
    set falta(value) {
        if (typeof value !== "boolean") {
            throw new Error("falta deve ser um valor booleano (true/false).");
        }
        this._falta = value;
    }
    get dia() {
        return this._dia;
    }
    set dia(value) {
        if (!(value instanceof Date)) {
            throw new Error("dia deve ser um objeto Date.");
        }
        if (isNaN(value.getTime())) {
            throw new Error(`dia inválido: "${value}".`);
        }
        this._dia = value;
    }
    get atrasado() {
        return this._atrasado;
    }
    set atrasado(value) {
        if (value !== "Sim" && value !== "Não") {
            throw new Error(`atrasado inválido: "${value}". Deve ser "Sim" ou "Não".`);
        }
        this._atrasado = value;
    }
    get nomeAcompanhante() {
        return this._nomeAcompanhante;
    }
    set nomeAcompanhante(value) {
        if (typeof value !== "string") {
            throw new Error("nomeAcompanhante deve ser uma string.");
        }
        this._nomeAcompanhante = value.trim();
    }
    get situacao() {
        return this._situacao;
    }
    set situacao(value) {
        const permitidos = ["Normal", "Abonada", "Dispensada"];
        if (!permitidos.includes(value)) {
            throw new Error(`situacao inválida: "${value}". Deve ser uma de: ${permitidos.join(", ")}.`);
        }
        this._situacao = value;
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
            idRegistro: this._idRegistro,
            ano: this._ano,
            codDisciplina: this._codDisciplina,
            horaInicio: this._horaInicio,
            horaFim: this._horaFim,
            matricula: this._matricula,
            alunoNome: this._alunoNome,
            turma: this._turma,
            curso: this._curso,
            serie: this._serie,
            falta: this._falta,
            dia: this._dia,
            atrasado: this._atrasado,
            nomeAcompanhante: this._nomeAcompanhante,
            situacao: this._situacao,
            auditoria: this._auditoria
        };
    }
}
exports.Registro = Registro;
//# sourceMappingURL=Registro.js.map