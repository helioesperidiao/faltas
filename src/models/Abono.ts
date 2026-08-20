import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class Abono {
    private _idAbono: string = '';
    private _idRegistro: string = '';
    private _matricula: string = '';
    private _codDisciplina: string = '';
    private _dia: Date = new Date();
    private _horasAbonadas: number = 0;
    private _motivo: string = '';
    private _auditoria: Auditoria = new Auditoria();

    constructor() {
        console.log("⬆️  Abono.constructor()");
    }

    get idAbono(): string {
        return this._idAbono;
    }

    set idAbono(value: string) {
        if (!value) {
            throw new Error("idAbono é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idAbono inválido: "${value}".`);
        }
        this._idAbono = value;
    }

    get idRegistro(): string {
        return this._idRegistro;
    }

    set idRegistro(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("idRegistro é obrigatório.");
        }
        if (value.trim().length > 24) {
            throw new Error("idRegistro pode ter no máximo 24 caracteres.");
        }
        this._idRegistro = value.trim();
    }

    get matricula(): string {
        return this._matricula;
    }

    set matricula(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("matricula é obrigatória.");
        }
        if (value.trim().length > 20) {
            throw new Error("matricula pode ter no máximo 20 caracteres.");
        }
        this._matricula = value.trim();
    }

    get codDisciplina(): string {
        return this._codDisciplina;
    }

    set codDisciplina(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("codDisciplina é obrigatório.");
        }
        if (value.trim().length > 20) {
            throw new Error("codDisciplina pode ter no máximo 20 caracteres.");
        }
        this._codDisciplina = value.trim();
    }

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

    get horasAbonadas(): number {
        return this._horasAbonadas;
    }

    set horasAbonadas(value: number) {
        if (typeof value !== "number" || isNaN(value)) {
            throw new Error("horasAbonadas deve ser um número.");
        }
        if (value < 0 || value > 24) {
            throw new Error(`horasAbonadas inválido: "${value}". Deve ser entre 0 e 24.`);
        }
        this._horasAbonadas = value;
    }

    get motivo(): string {
        return this._motivo;
    }

    set motivo(value: string) {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new Error("motivo é obrigatório.");
        }
        if (value.trim().length > 512) {
            throw new Error("motivo pode ter no máximo 512 caracteres.");
        }
        this._motivo = value.trim();
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
            idAbono: this._idAbono,
            idRegistro: this._idRegistro,
            matricula: this._matricula,
            codDisciplina: this._codDisciplina,
            dia: this._dia,
            horasAbonadas: this._horasAbonadas,
            motivo: this._motivo,
            auditoria: this._auditoria
        };
    }
}
