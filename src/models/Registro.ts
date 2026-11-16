import { ErrorResponse } from "../http/ErrorResponse";
import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class Registro {

    //iniciando as variaveis
    private _idRegistro: string = '';
    private _ano: number = new Date().getFullYear();
    private _codDisciplina: string = '';
    private _horaInicio: number = 0;
    private _horaFim: number = 0;
    private _matricula: string = '';
    private _alunoNome: string = '';
    private _turma: string = '';
    private _curso: string = '';
    private _serie: string = '';
    private _falta: boolean = false;
    private _dia: Date = new Date();
    private _atrasado: string = 'Não';
    private _nomeAcompanhante: string = '';
    private _situacao: string = 'Normal';
    private _auditoria: Auditoria = new Auditoria();

    //construtor
    constructor() {
    }

    //gets e sets

    //idRegistro
    get idRegistro(): string {
        return this._idRegistro;
    }
    set idRegistro(value: string) {
        if (!value) {
            throw new ErrorResponse(400, "idRegistro é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new ErrorResponse(400, `idRegistro inválido: "${value}".`);
        }
        this._idRegistro = value;
    }

    //ano
    get ano(): number {
        return this._ano;
    }
    set ano(value: number) {
        if (typeof value !== "number" || isNaN(value)) {
            throw new ErrorResponse(400, "ano deve ser um número.");
        }
        if (value < 2000 || value > 2100) {
            throw new ErrorResponse(400, `ano inválido: "${value}".`);
        }
        this._ano = value;
    }

    //codDisciplina
    get codDisciplina(): string {
        return this._codDisciplina;
    }
    set codDisciplina(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new ErrorResponse(400, "codDisciplina é obrigatório.");
        }
        this._codDisciplina = value.trim();
    }

    //horaInicio
    get horaInicio(): number {
        return this._horaInicio;
    }
    set horaInicio(value: number) {
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new ErrorResponse(400, `horaInicio inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaInicio = value;
    }

    //horaFim
    get horaFim(): number {
        return this._horaFim;
    }
    set horaFim(value: number) {
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new ErrorResponse(400, `horaFim inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaFim = value;
    }

    //matricula
    get matricula(): string {
        return this._matricula;
    }
    set matricula(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new ErrorResponse(400, "matricula é obrigatória.");
        }
        this._matricula = value.trim();
    }

    get alunoNome(): string { return this._alunoNome; }
    set alunoNome(value: string) { this._alunoNome = (value || '').trim(); }

    get turma(): string { return this._turma; }
    set turma(value: string) { this._turma = (value || '').trim(); }

    get curso(): string { return this._curso; }
    set curso(value: string) { this._curso = (value || '').trim(); }

    get serie(): string { return this._serie; }
    set serie(value: string) { this._serie = (value || '').trim(); }

    //falta 
    get falta(): boolean {
        return this._falta;
    }
    set falta(value: boolean) {
        if (typeof value !== "boolean") {
            throw new ErrorResponse(400, "falta deve ser um valor booleano (true/false).");
        }
        this._falta = value;
    }

    //dia
    get dia(): Date {
        return this._dia;
    }
    set dia(value: Date) {
        if (!(value instanceof Date)) {
            throw new ErrorResponse(400, "dia deve ser um objeto Date.");
        }
        if (isNaN(value.getTime())) {
            throw new ErrorResponse(400, `dia inválido: "${value}".`);
        }
        this._dia = value;
    }

    //atrasado
    get atrasado(): string {
        return this._atrasado;
    }
    set atrasado(value: string) {
        if (value !== "Sim" && value !== "Não") {
            throw new ErrorResponse(400, `atrasado inválido: "${value}". Deve ser "Sim" ou "Não".`);
        }
        this._atrasado = value;
    }

    //nomeAcompanhante
    get nomeAcompanhante(): string {
        return this._nomeAcompanhante;
    }
    set nomeAcompanhante(value: string) {
        if (typeof value !== "string") {
            throw new ErrorResponse(400, "nomeAcompanhante deve ser uma string.");
        }
        this._nomeAcompanhante = value.trim();
    }

    //situacao (Normal, Abonada, Dispensada)
    get situacao(): string {
        return this._situacao;
    }
    set situacao(value: string) {
        const permitidos = ["Normal", "Abonada", "Dispensada"];
        if (!permitidos.includes(value)) {
            throw new ErrorResponse(400, `situacao inválida: "${value}". Deve ser uma de: ${permitidos.join(", ")}.`);
        }
        this._situacao = value;
    }

    //auditoria
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

    //json
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
