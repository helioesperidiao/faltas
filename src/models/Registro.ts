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
    private _falta: boolean = false;
    private _dia: Date = new Date();
    private _atrasado: string = 'Não';
    private _nomeAcompanhante: string = '';
    private _auditoria: Auditoria = new Auditoria();

    //construtor
    constructor() {
        console.log("⬆️  Registro.constructor()");
    }

    //gets e sets

    //idRegistro
    get idRegistro(): string {
        return this._idRegistro;
    }
    set idRegistro(value: string) {
        if (!value) {
            throw new Error("idRegistro é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idRegistro inválido: "${value}".`);
        }
        this._idRegistro = value;
    }

    //ano
    get ano(): number {
        return this._ano;
    }
    set ano(value: number) {
        if (typeof value !== "number" || isNaN(value)) {
            throw new Error("ano deve ser um número.");
        }
        if (value < 2000 || value > 2100) {
            throw new Error(`ano inválido: "${value}".`);
        }
        this._ano = value;
    }

    //codDisciplina
    get codDisciplina(): string {
        return this._codDisciplina;
    }
    set codDisciplina(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("codDisciplina é obrigatório.");
        }
        this._codDisciplina = value.trim();
    }

    //horaInicio
    get horaInicio(): number {
        return this._horaInicio;
    }
    set horaInicio(value: number) {
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`horaInicio inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaInicio = value;
    }

    //horaFim
    get horaFim(): number {
        return this._horaFim;
    }
    set horaFim(value: number) {
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`horaFim inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaFim = value;
    }

    //matricula
    get matricula(): string {
        return this._matricula;
    }
    set matricula(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("matricula é obrigatória.");
        }
        this._matricula = value.trim();
    }

    //falta 
    get falta(): boolean {
        return this._falta;
    }
    set falta(value: boolean) {
        if (typeof value !== "boolean") {
            throw new Error("falta deve ser um valor booleano (true/false).");
        }
        this._falta = value;
    }

    //dia
    get dia(): Date {
        return this._dia;
    }
    set dia(value: Date) {
        if (!(value instanceof Date)) {
            throw new Error("dia deve ser um objeto Date.");
        }
        if (isNaN(value.getTime())) {
            throw new Error(`dia inválido: "${value}".`);
        }
        this._dia = value;
    }

    //atrasado
    get atrasado(): string {
        return this._atrasado;
    }
    set atrasado(value: string) {
        if (value !== "Sim" && value !== "Não") {
            throw new Error(`atrasado inválido: "${value}". Deve ser "Sim" ou "Não".`);
        }
        this._atrasado = value;
    }

    //nomeAcompanhante
    get nomeAcompanhante(): string {
        return this._nomeAcompanhante;
    }
    set nomeAcompanhante(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeAcompanhante deve ser uma string.");
        }
        this._nomeAcompanhante = value.trim();
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
            falta: this._falta,
            dia: this._dia,
            atrasado: this._atrasado,
            nomeAcompanhante: this._nomeAcompanhante,
            auditoria: this._auditoria
        };
    }
}