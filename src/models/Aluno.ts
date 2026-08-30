import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class Aluno {
    private _idAluno: string = '';
    private _matricula: string = '';
    private _alunoNome: string = '';
    private _turma: string = '';
    private _curso: string = '';
    private _serie: string = '';
    private _situacao: string = 'Ativo';
    private _ano: string = String(new Date().getFullYear());
    private _dataNascimento: string = '';
    private _alunoRG: string = '';
    private _alunoFone: string = '';
    private _alunoEmail: string = '';
    private _alunoFoneCel: string = '';
    private _paiNome: string = '';
    private _paiFoneCel: string = '';
    private _paiFoneFixo: string = '';
    private _paiFoneRecado: string = '';
    private _paiEmail: string = '';
    private _maeNome: string = '';
    private _maeFoneCel: string = '';
    private _maeFoneFixo: string = '';
    private _maeFoneRecado: string = '';
    private _maeEmail: string = '';
    private _finanNome: string = '';
    private _finanFone: string = '';
    private _legalNome: string = '';
    private _legalFone: string = '';
    private _auditoria: Auditoria = new Auditoria();

    constructor() {
        console.log("⬆️  Aluno.constructor()");
    }

    get idAluno(): string {
        return this._idAluno;
    }
    set idAluno(value: string) {
        if (!value) {
            throw new Error("idAluno é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idAluno inválido: "${value}".`);
        }
        this._idAluno = value;
    }

    get matricula(): string {
        return this._matricula;
    }
    set matricula(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("matricula é obrigatória.");
        }
        if (value.trim().length > 8) {
            throw new Error("matricula pode ter no máximo 8 caracteres.");
        }
        this._matricula = value.trim();
    }

    get alunoNome(): string {
        return this._alunoNome;
    }
    set alunoNome(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("alunoNome é obrigatório.");
        }
        this._alunoNome = value.trim();
    }

    get turma(): string {
        return this._turma;
    }
    set turma(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("turma é obrigatória.");
        }
        this._turma = value.trim();
    }

    get curso(): string {
        return this._curso;
    }
    set curso(value: string) {
        this._curso = (value || '').trim();
    }

    get serie(): string {
        return this._serie;
    }
    set serie(value: string) {
        this._serie = (value || '').trim();
    }

    get situacao(): string {
        return this._situacao;
    }
    set situacao(value: string) {
        this._situacao = (value || 'Ativo').trim();
    }

    get ano(): string {
        return this._ano;
    }
    set ano(value: string) {
        this._ano = (value || '').toString().trim();
    }

    get dataNascimento(): string {
        return this._dataNascimento;
    }
    set dataNascimento(value: string) {
        this._dataNascimento = (value || '').trim();
    }

    get alunoRG(): string {
        return this._alunoRG;
    }
    set alunoRG(value: string) {
        this._alunoRG = (value || '').trim();
    }

    get alunoFone(): string {
        return this._alunoFone;
    }
    set alunoFone(value: string) {
        this._alunoFone = (value || '').trim();
    }

    get alunoEmail(): string {
        return this._alunoEmail;
    }
    set alunoEmail(value: string) {
        this._alunoEmail = (value || '').trim();
    }

    get alunoFoneCel(): string {
        return this._alunoFoneCel;
    }
    set alunoFoneCel(value: string) {
        this._alunoFoneCel = (value || '').trim();
    }

    get paiNome(): string { return this._paiNome; }
    set paiNome(value: string) { this._paiNome = (value || '').trim(); }

    get paiFoneCel(): string { return this._paiFoneCel; }
    set paiFoneCel(value: string) { this._paiFoneCel = (value || '').trim(); }

    get paiFoneFixo(): string { return this._paiFoneFixo; }
    set paiFoneFixo(value: string) { this._paiFoneFixo = (value || '').trim(); }

    get paiFoneRecado(): string { return this._paiFoneRecado; }
    set paiFoneRecado(value: string) { this._paiFoneRecado = (value || '').trim(); }

    get paiEmail(): string { return this._paiEmail; }
    set paiEmail(value: string) { this._paiEmail = (value || '').trim(); }

    get maeNome(): string { return this._maeNome; }
    set maeNome(value: string) { this._maeNome = (value || '').trim(); }

    get maeFoneCel(): string { return this._maeFoneCel; }
    set maeFoneCel(value: string) { this._maeFoneCel = (value || '').trim(); }

    get maeFoneFixo(): string { return this._maeFoneFixo; }
    set maeFoneFixo(value: string) { this._maeFoneFixo = (value || '').trim(); }

    get maeFoneRecado(): string { return this._maeFoneRecado; }
    set maeFoneRecado(value: string) { this._maeFoneRecado = (value || '').trim(); }

    get maeEmail(): string { return this._maeEmail; }
    set maeEmail(value: string) { this._maeEmail = (value || '').trim(); }

    get finanNome(): string { return this._finanNome; }
    set finanNome(value: string) { this._finanNome = (value || '').trim(); }

    get finanFone(): string { return this._finanFone; }
    set finanFone(value: string) { this._finanFone = (value || '').trim(); }

    get legalNome(): string { return this._legalNome; }
    set legalNome(value: string) { this._legalNome = (value || '').trim(); }

    get legalFone(): string { return this._legalFone; }
    set legalFone(value: string) { this._legalFone = (value || '').trim(); }

    get auditoria(): Auditoria {
        return this._auditoria;
    }
    set auditoria(value: Auditoria) {
        this._auditoria = value;
    }

    public marcarCriadoPor(idFuncionario: string): void {
        this._auditoria.marcarCriadoPor(idFuncionario);
    }
    public marcarAlteradoPor(idFuncionario: string): void {
        this._auditoria.marcarAlteradoPor(idFuncionario);
    }
    public marcarDeletadoPor(idFuncionario: string): void {
        this._auditoria.marcarDeletadoPor(idFuncionario);
    }
    public isDeletado(): boolean {
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
