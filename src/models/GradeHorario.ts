import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class GradeHorario {
    private _idGradeHorario: string = '';
    private _turma: string = '';
    private _horaInicio: string = '';
    private _horaFim: string = '';
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

    get horaInicio(): string {
        return this._horaInicio;
    }
    set horaInicio(value: string | number) {
        this._horaInicio = this.normalizarHorario(value, "horaInicio");
    }

    get horaFim(): string {
        return this._horaFim;
    }
    set horaFim(value: string | number) {
        this._horaFim = this.normalizarHorario(value, "horaFim");
    }

    private normalizarHorario(value: string | number, campo: string): string {
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

    private formatarMinutos(minutos: number, campo: string): string {
        if (minutos < 0 || minutos >= 24 * 60) {
            throw new Error(`${campo} inválido.`);
        }
        const hora = Math.floor(minutos / 60);
        const minuto = minutos % 60;
        return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
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
