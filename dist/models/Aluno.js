"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aluno = void 0;
const mongodb_1 = require("mongodb");
const Auditoria_1 = require("./Auditoria");
class Aluno {
    _idAluno = '';
    _matricula = '';
    _alunoNome = '';
    _turma = '';
    _curso = '';
    _serie = '';
    _situacao = 'Ativo';
    _ano = String(new Date().getFullYear());
    _dataNascimento = '';
    _alunoRG = '';
    _alunoFone = '';
    _alunoEmail = '';
    _alunoFoneCel = '';
    _paiNome = '';
    _paiFoneCel = '';
    _paiFoneFixo = '';
    _paiFoneRecado = '';
    _paiEmail = '';
    _maeNome = '';
    _maeFoneCel = '';
    _maeFoneFixo = '';
    _maeFoneRecado = '';
    _maeEmail = '';
    _finanNome = '';
    _finanFone = '';
    _legalNome = '';
    _legalFone = '';
    _auditoria = new Auditoria_1.Auditoria();
    constructor() {
        console.log("⬆️  Aluno.constructor()");
    }
    get idAluno() {
        return this._idAluno;
    }
    set idAluno(value) {
        if (!value) {
            throw new Error("idAluno é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idAluno inválido: "${value}".`);
        }
        this._idAluno = value;
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
    get alunoNome() {
        return this._alunoNome;
    }
    set alunoNome(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("alunoNome é obrigatório.");
        }
        this._alunoNome = value.trim();
    }
    get turma() {
        return this._turma;
    }
    set turma(value) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("turma é obrigatória.");
        }
        this._turma = value.trim();
    }
    get curso() {
        return this._curso;
    }
    set curso(value) {
        this._curso = (value || '').trim();
    }
    get serie() {
        return this._serie;
    }
    set serie(value) {
        this._serie = (value || '').trim();
    }
    get situacao() {
        return this._situacao;
    }
    set situacao(value) {
        this._situacao = (value || 'Ativo').trim();
    }
    get ano() {
        return this._ano;
    }
    set ano(value) {
        this._ano = (value || '').toString().trim();
    }
    get dataNascimento() {
        return this._dataNascimento;
    }
    set dataNascimento(value) {
        this._dataNascimento = (value || '').trim();
    }
    get alunoRG() {
        return this._alunoRG;
    }
    set alunoRG(value) {
        this._alunoRG = (value || '').trim();
    }
    get alunoFone() {
        return this._alunoFone;
    }
    set alunoFone(value) {
        this._alunoFone = (value || '').trim();
    }
    get alunoEmail() {
        return this._alunoEmail;
    }
    set alunoEmail(value) {
        this._alunoEmail = (value || '').trim();
    }
    get alunoFoneCel() {
        return this._alunoFoneCel;
    }
    set alunoFoneCel(value) {
        this._alunoFoneCel = (value || '').trim();
    }
    get paiNome() { return this._paiNome; }
    set paiNome(value) { this._paiNome = (value || '').trim(); }
    get paiFoneCel() { return this._paiFoneCel; }
    set paiFoneCel(value) { this._paiFoneCel = (value || '').trim(); }
    get paiFoneFixo() { return this._paiFoneFixo; }
    set paiFoneFixo(value) { this._paiFoneFixo = (value || '').trim(); }
    get paiFoneRecado() { return this._paiFoneRecado; }
    set paiFoneRecado(value) { this._paiFoneRecado = (value || '').trim(); }
    get paiEmail() { return this._paiEmail; }
    set paiEmail(value) { this._paiEmail = (value || '').trim(); }
    get maeNome() { return this._maeNome; }
    set maeNome(value) { this._maeNome = (value || '').trim(); }
    get maeFoneCel() { return this._maeFoneCel; }
    set maeFoneCel(value) { this._maeFoneCel = (value || '').trim(); }
    get maeFoneFixo() { return this._maeFoneFixo; }
    set maeFoneFixo(value) { this._maeFoneFixo = (value || '').trim(); }
    get maeFoneRecado() { return this._maeFoneRecado; }
    set maeFoneRecado(value) { this._maeFoneRecado = (value || '').trim(); }
    get maeEmail() { return this._maeEmail; }
    set maeEmail(value) { this._maeEmail = (value || '').trim(); }
    get finanNome() { return this._finanNome; }
    set finanNome(value) { this._finanNome = (value || '').trim(); }
    get finanFone() { return this._finanFone; }
    set finanFone(value) { this._finanFone = (value || '').trim(); }
    get legalNome() { return this._legalNome; }
    set legalNome(value) { this._legalNome = (value || '').trim(); }
    get legalFone() { return this._legalFone; }
    set legalFone(value) { this._legalFone = (value || '').trim(); }
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
            idAluno: this._idAluno,
            matricula: this._matricula,
            alunoNome: this._alunoNome,
            turma: this._turma,
            curso: this._curso,
            serie: this._serie,
            situacao: this._situacao,
            ano: this._ano,
            dataNascimento: this._dataNascimento,
            alunoRG: this._alunoRG,
            alunoFone: this._alunoFone,
            alunoEmail: this._alunoEmail,
            alunoFoneCel: this._alunoFoneCel,
            paiNome: this._paiNome,
            paiFoneCel: this._paiFoneCel,
            paiFoneFixo: this._paiFoneFixo,
            paiFoneRecado: this._paiFoneRecado,
            paiEmail: this._paiEmail,
            maeNome: this._maeNome,
            maeFoneCel: this._maeFoneCel,
            maeFoneFixo: this._maeFoneFixo,
            maeFoneRecado: this._maeFoneRecado,
            maeEmail: this._maeEmail,
            finanNome: this._finanNome,
            finanFone: this._finanFone,
            legalNome: this._legalNome,
            legalFone: this._legalFone,
            auditoria: this._auditoria
        };
    }
}
exports.Aluno = Aluno;
//# sourceMappingURL=Aluno.js.map