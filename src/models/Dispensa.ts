import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

export class Dispensa {
    private _idDispensa: string = '';
    private _idAluno: string = '';
    private _auditoria: Auditoria = new Auditoria();
    private _turma: string = '';
    private _horaInicio: number = 0;
    private _horaFim: number = 0;
    private _dia: Date = new Date;
    private _cod: string = '';
    private _disciplina: string = '';
    private _motivo: string = '';
    private _nomeArquivo: string = '';

    //construtor
    constructor() {
        console.log("⬆️  Dispensa.constructor()");
    }

    //gets e sets

    //idDispensa
    get idDispensa(): string{
        return this._idDispensa;
    }
    set idDispensa(value: string){
        if (!value) {
            throw new Error("idDispensa é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idDispensa inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idDispensa = value;
    }

    //idAluno (referência à matrícula/id do aluno, igual fizemos em Registro)
    get idAluno(): string{
        return this._idAluno;
    }
    set idAluno(value: string){
        if (!value) {
            throw new Error("idAluno é obrigatório.");
        }
        if (value.length > 20) {
            throw new Error(`idAluno pode ter no máximo 20 caracteres.`);
        }
        this._idAluno = value;
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

    //turma
    get turma(): string{
        return this._turma;
    }
    set turma(value: string){
        if (!value) {
            throw new Error("Turma é obrigatório.");
        }
        if (value.length > 20) {
            throw new Error(`Turma pode ter no máximo 20 caracteres.`);
        }
        this._turma = value;
    }

    //horaInicio
    get horaInicio(): number {
        return this._horaInicio;
    }
    set horaInicio(value: number) {
        if (value === undefined || value === null) {
            throw new Error("Horário de início é obrigatório.");
        }
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`Horário de início inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaInicio = value;
    }

    //horaFim
    get horaFim(): number {
        return this._horaFim;
    }
    set horaFim(value: number) {
        if (value === undefined || value === null) {
            throw new Error("Horário final é obrigatório.");
        }
        if (typeof value !== "number" || value < 0 || value > 23) {
            throw new Error(`Horário final inválido: "${value}". Deve ser entre 0 e 23.`);
        }
        this._horaFim = value;
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

    //cod
    get cod(): string{
        return this._cod;
    }
    set cod (value: string){
        if (!value) {
            throw new Error("Código é obrigatório.");
        }
        if (value.length > 20) {
            throw new Error(`Código pode ter no máximo 20 caracteres.`);
        }
        this._cod = value;
    }

    //disciplina
    get disciplina(): string{
        return this._disciplina;
    }
    set disciplina(value: string){
        if (!value) {
            throw new Error("Disciplina é obrigatório.");
        }
        if (value.length > 100) {
            throw new Error(`Disciplina pode ter no máximo 100 caracteres.`);
        }
        this._disciplina = value;
    }

    //motivo
    get motivo(): string{
        return this._motivo;
    }
    set motivo(value: string){
        if (!value) {
            throw new Error("Motivo é obrigatório.");
        }
        if(value.length > 512){
            throw new Error(`Motivo pode ter no máximo 512 caracteres.`);
        }
        this._motivo = value;
    }

    //nomeArquivo
    get nomeArquivo(): string{
        return this._nomeArquivo;
    }
    set nomeArquivo(value: string){
        if (typeof value !== "string") {
            throw new Error("nomeArquivo deve ser uma string.");
        }
        if (value.trim().length > 50) {
            throw new Error("nomeArquivo deve ter no máximo 50 caracteres.");
        }
        this._nomeArquivo = value.trim();
    }

    //json
    toJSON() {
        return {
            idDispensa: this._idDispensa,
            idAluno: this._idAluno,
            turma: this._turma,
            horaInicio: this._horaInicio,
            horaFim: this._horaFim,
            dia: this._dia,
            cod: this._cod,
            disciplina: this._disciplina,
            motivo: this._motivo,
            nomeArquivo: this._nomeArquivo,
            auditoria: this._auditoria
        };
    }
}