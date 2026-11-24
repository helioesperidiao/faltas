import { ErrorResponse } from "../http/ErrorResponse";
import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export type TipoMovimentacao = "entrada" | "saida";
/** Horários disponíveis para registrar atrasos e saídas nos dois períodos. */
export const HORARIOS_MOVIMENTACAO = [
    "07:50", "08:40", "09:50", "10:40", "11:40",
    "13:00", "13:50", "14:40", "15:30", "16:20", "17:00"
] as const;

export class Movimentacao {
    private _idMovimentacao: string = "";
    private _nomeAluno: string = "";
    private _matricula: string = "";
    private _data: Date = new Date();
    private _horario: string = "";
    private _tipo: TipoMovimentacao = "entrada";
    private _motivo: string = "";
    private _nomeArquivo: string = "";
    private _auditoria: Auditoria = new Auditoria();

    get idMovimentacao(): string { return this._idMovimentacao; }
    set idMovimentacao(value: string) {
        if (!value || !ObjectId.isValid(value)) throw new ErrorResponse(400, "idMovimentacao inválido.");
        this._idMovimentacao = value;
    }

    get nomeAluno(): string { return this._nomeAluno; }
    set nomeAluno(value: string) {
        if (typeof value !== "string" || !value.trim()) throw new ErrorResponse(400, "nomeAluno é obrigatório.");
        this._nomeAluno = value.trim();
    }

    get matricula(): string { return this._matricula; }
    set matricula(value: string) {
        if (typeof value !== "string" || !value.trim()) throw new ErrorResponse(400, "matricula é obrigatória.");
        this._matricula = value.trim();
    }

    get data(): Date { return this._data; }
    set data(value: Date) {
        if (!(value instanceof Date) || isNaN(value.getTime())) throw new ErrorResponse(400, "data inválida.");
        this._data = value;
    }

    get horario(): string { return this._horario; }
    set horario(value: string) {
        if (typeof value !== "string" || !HORARIOS_MOVIMENTACAO.includes(value as typeof HORARIOS_MOVIMENTACAO[number])) {
            throw new ErrorResponse(400, "horário inválido. Use um dos horários oficiais de entrada ou saída.");
        }
        this._horario = value;
    }

    get tipo(): TipoMovimentacao { return this._tipo; }
    set tipo(value: TipoMovimentacao) {
        if (value !== "entrada" && value !== "saida") throw new ErrorResponse(400, "tipo deve ser entrada ou saida.");
        this._tipo = value;
    }

    get motivo(): string { return this._motivo; }
    set motivo(value: string) {
        if (value && !["com responsável", "atestado", "orientação", "bilhete"].includes(value)) throw new Error("Motivo inválido.");
        this._motivo = value || "";
    }
    get nomeArquivo(): string { return this._nomeArquivo; }
    set nomeArquivo(value: string) { this._nomeArquivo = value || ""; }

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
            motivo: this._motivo,
            nomeArquivo: this._nomeArquivo,
            auditoria: this._auditoria.toJSON()
        };
    }
}
