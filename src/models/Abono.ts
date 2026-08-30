import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class Abono {
    private _idAbono: string = '';
    private _matricula: string = '';
    private _dataInicio: Date = new Date();
    private _dataFim: Date = new Date();
    private _motivo: string = '';
    private _nomeArquivo: string = '';
    private _status: string = 'Pendente';
    private _aprovadoPor: string = '';
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

    get dataInicio(): Date {
        return this._dataInicio;
    }

    set dataInicio(value: Date) {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            throw new Error(`dataInicio inválida: "${value}".`);
        }
        this._dataInicio = value;
    }

    get dataFim(): Date {
        return this._dataFim;
    }

    set dataFim(value: Date) {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            throw new Error(`dataFim inválida: "${value}".`);
        }
        this._dataFim = value;
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

    get nomeArquivo(): string {
        return this._nomeArquivo;
    }

    set nomeArquivo(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeArquivo deve ser uma string.");
        }
        if (value.trim().length > 255) {
            throw new Error("nomeArquivo deve ter no máximo 255 caracteres.");
        }
        this._nomeArquivo = value.trim();
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        const permitidos = ["Pendente", "Aprovado", "Rejeitado"];
        if (!permitidos.includes(value)) {
            throw new Error(`status inválido: "${value}". Deve ser uma de: ${permitidos.join(", ")}.`);
        }
        this._status = value;
    }

    get aprovadoPor(): string {
        return this._aprovadoPor;
    }

    set aprovadoPor(value: string) {
        this._aprovadoPor = (value || '').trim();
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
            matricula: this._matricula,
            dataInicio: this._dataInicio,
            dataFim: this._dataFim,
            motivo: this._motivo,
            nomeArquivo: this._nomeArquivo,
            status: this._status,
            aprovadoPor: this._aprovadoPor,
            auditoria: this._auditoria
        };
    }
}

