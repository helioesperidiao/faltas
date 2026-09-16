"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dispensa = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class Dispensa {
    _idDispensa = '';
    _idAluno = '';
    _auditoria = new Auditoria_1.Auditoria();
    _turma = '';
    _horaInicio = 0;
    _horaFim = 0;
    _dia = new Date;
    _dataFim = new Date;
    _cod = '';
    _disciplina = '';
    _motivo = '';
    _nomeArquivo = '';
    constructor() {
        console.log("⬆️  Dispensa.constructor()");
    }
    get idDispensa() {
        return this._idDispensa;
    }
    set idDispensa(value) {
        if (!value) {
            throw new Error("idDispensa é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idDispensa inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idDispensa = value;
    }
    get idAluno() {
        return this._idAluno;
    }
    set idAluno(value) {
        if (!value) {
            throw new Error("idAluno é obrigatório.");
        }
        if (value.length > 20) {
            throw new Error(`idAluno pode ter no máximo 20 caracteres.`);
        }
        this._idAluno = value;
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
    get turma() {
        return this._turma;
    }
    set turma(value) {
        if (!value) {
            throw new Error("Turma é obrigatório.");
        }
        if (value.length > 20) {
            throw new Error(`Turma pode ter no máximo 20 caracteres.`);
        }
        this._turma = value;
    }
    get horaInicio() {
        return this._horaInicio;
    }
    set horaInicio(value) {
        if (value === undefined || value === null) {
            throw new Error("Horário de início é obrigatório.");
        }
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`Horário de início inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaInicio = value;
    }
    get horaFim() {
        return this._horaFim;
    }
    set horaFim(value) {
        if (value === undefined || value === null) {
            throw new Error("Horário final é obrigatório.");
        }
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`Horário final inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaFim = value;
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
    get dataFim() {
        return this._dataFim;
    }
    set dataFim(value) {
        if (!(value instanceof Date)) {
            throw new Error("dataFim deve ser um objeto Date.");
        }
        if (isNaN(value.getTime())) {
            throw new Error(`dataFim inválido: "${value}".`);
        }
        this._dataFim = value;
    }
    get cod() {
        return this._cod;
    }
    set cod(value) {
        if (!value) {
            throw new Error("Código é obrigatório.");
        }
        if (value.length > 20) {
            throw new Error(`Código pode ter no máximo 20 caracteres.`);
        }
        this._cod = value;
    }
    get disciplina() {
        return this._disciplina;
    }
    set disciplina(value) {
        if (!value) {
            throw new Error("Disciplina é obrigatório.");
        }
        if (value.length > 100) {
            throw new Error(`Disciplina pode ter no máximo 100 caracteres.`);
        }
        this._disciplina = value;
    }
    get motivo() {
        return this._motivo;
    }
    set motivo(value) {
        if (!value) {
            throw new Error("Motivo é obrigatório.");
        }
        if (value.length > 512) {
            throw new Error(`Motivo pode ter no máximo 512 caracteres.`);
        }
        this._motivo = value;
    }
    get nomeArquivo() {
        return this._nomeArquivo;
    }
    set nomeArquivo(value) {
        if (typeof value !== "string") {
            throw new Error("nomeArquivo deve ser uma string.");
        }
        if (value.trim().length > 50) {
            throw new Error("nomeArquivo deve ter no máximo 50 caracteres.");
        }
        this._nomeArquivo = value.trim();
    }
    toJSON() {
        return {
            idDispensa: this._idDispensa,
            idAluno: this._idAluno,
            turma: this._turma,
            horaInicio: this._horaInicio,
            horaFim: this._horaFim,
            dia: this._dia,
            dataFim: this._dataFim,
            cod: this._cod,
            disciplina: this._disciplina,
            motivo: this._motivo,
            nomeArquivo: this._nomeArquivo,
            auditoria: this._auditoria
        };
    }
}
exports.Dispensa = Dispensa;
//# sourceMappingURL=Dispensa.js.map