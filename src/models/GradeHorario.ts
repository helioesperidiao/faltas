import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class GradeHorario {
    private _idGradeHorario: string = '';
    private _turma: string = '';
    private _horaInicio: number = 0;
    private _horaFim: number = 0;
    private _dia: string = '';
    private _cod: string = '';
    private _disciplina: string = '';
    private _auditoria: Auditoria = new Auditoria();

    constructor() {
        console.log("⬆️  GradeHorario.constructor()");
    }

    get idGradeHorario(): string {
        return this._idGradeHorario;
    }
    set idGradeHorario(value: string) {
        if (!value) {
            throw new Error("idGradeHorario é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idGradeHorario inválido: "${value}".`);
        }
        this._idGradeHorario = value;
    }

    get turma(): string {
        return this._turma;
    }
    set turma(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("turma é obrigatória.");
        }
        if (value.trim().length > 20) {
            throw new Error("turma pode ter no máximo 20 caracteres.");
        }
        this._turma = value.trim();
    }

    get horaInicio(): number {
        return this._horaInicio;
    }
    set horaInicio(value: number) {
        if (!GradeHorario.isHorarioValido(value)) {
            throw new Error(`horaInicio inválido: "${value}". Use hora inteira ou formato HHMM.`);
        }
        this._horaInicio = value;
    }

    get horaFim(): number {
        return this._horaFim;
    }
    set horaFim(value: number) {
        if (!GradeHorario.isHorarioValido(value)) {
            throw new Error(`horaFim inválido: "${value}". Use hora inteira ou formato HHMM.`);
        }
        this._horaFim = value;
    }

    public static isHorarioValido(value: number): boolean {
        if (!Number.isInteger(value) || value < 0) return false;
        if (value <= 23) return true;
        const minutos = value % 100;
        return value <= 2359 && minutos < 60;
    }

    get dia(): string {
        return this._dia;
    }
    set dia(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("dia é obrigatório.");
        }
        if (value.trim().length > 20) {
            throw new Error("dia pode ter no máximo 20 caracteres.");
        }
        this._dia = value.trim();
    }

    get cod(): string {
        return this._cod;
    }
    set cod(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("cod é obrigatório.");
        }
        if (value.trim().length > 20) {
            throw new Error("cod pode ter no máximo 20 caracteres.");
        }
        this._cod = value.trim();
    }

    get disciplina(): string {
        return this._disciplina;
    }
    set disciplina(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("disciplina é obrigatória.");
        }
        if (value.trim().length > 100) {
            throw new Error("disciplina pode ter no máximo 100 caracteres.");
        }
        this._disciplina = value.trim();
    }

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
