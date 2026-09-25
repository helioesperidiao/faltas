import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export type TipoMovimentacao = "entrada" | "saida";
export const HORARIOS_MOVIMENTACAO = ["07:50", "08:40", "09:50", "10:40", "11:40"] as const;

export class Movimentacao {
    private _idMovimentacao: string = "";
    private _nomeAluno: string = "";
    private _matricula: string = "";
    private _data: Date = new Date();
    private _horario: string = "";
    private _tipo: TipoMovimentacao = "entrada";
    private _auditoria: Auditoria = new Auditoria();

    get idMovimentacao(): string { return this._idMovimentacao; }
    set idMovimentacao(value: string) {
        if (!value || !ObjectId.isValid(value)) throw new Error("idMovimentacao inválido.");
        this._idMovimentacao = value;
    }

    get nomeAluno(): string { return this._nomeAluno; }
    set nomeAluno(value: string) {
        if (typeof value !== "string" || !value.trim()) throw new Error("nomeAluno é obrigatório.");
        this._nomeAluno = value.trim();
    }

    get matricula(): string { return this._matricula; }
    set matricula(value: string) {
        if (typeof value !== "string" || !value.trim()) throw new Error("matricula é obrigatória.");
        this._matricula = value.trim();
    }

    get data(): Date { return this._data; }
    set data(value: Date) {
        if (!(value instanceof Date) || isNaN(value.getTime())) throw new Error("data inválida.");
        this._data = value;
    }

    get horario(): string { return this._horario; }
    set horario(value: string) {
        if (typeof value !== "string" || !HORARIOS_MOVIMENTACAO.includes(value as typeof HORARIOS_MOVIMENTACAO[number])) {
            throw new Error("horário inválido. Use um dos horários oficiais de entrada ou saída.");
        }
        this._horario = value;
    }

    get tipo(): TipoMovimentacao { return this._tipo; }
    set tipo(value: TipoMovimentacao) {
        if (value !== "entrada" && value !== "saida") throw new Error("tipo deve ser entrada ou saida.");
        this._tipo = value;
    }

    get auditoria(): Auditoria { return this._auditoria; }
    set auditoria(value: Auditoria) { this._auditoria = value; }

    marcarCriadoPor(idFuncionario: string): void { this._auditoria.marcarCriadoPor(idFuncionario); }

    toJSON() {
        return {
            idMovimentacao: this._idMovimentacao,
            nomeAluno: this._nomeAluno,
            matricula: this._matricula,
            data: this._data.toISOString(),
            horario: this._horario,
            tipo: this._tipo,
            auditoria: this._auditoria.toJSON()
        };
    }
}
