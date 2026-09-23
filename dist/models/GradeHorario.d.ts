import { Auditoria } from "./Auditoria";
export declare class GradeHorario {
    private _idGradeHorario;
    private _turma;
    private _horaInicio;
    private _horaFim;
    private _dia;
    private _cod;
    private _disciplina;
    private _auditoria;
    constructor();
    get idGradeHorario(): string;
    set idGradeHorario(value: string);
    get turma(): string;
    set turma(value: string);
    get horaInicio(): number;
    set horaInicio(value: number);
    get horaFim(): number;
    set horaFim(value: number);
    static isHorarioValido(value: number): boolean;
    get dia(): string;
    set dia(value: string);
    get cod(): string;
    set cod(value: string);
    get disciplina(): string;
    set disciplina(value: string);
    get auditoria(): Auditoria;
    set auditoria(value: Auditoria);
    marcarCriadoPor(idFuncionario: string): void;
    marcarAlteradoPor(idFuncionario: string): void;
    marcarDeletadoPor(idFuncionario: string): void;
    isDeletado(): boolean;
    toJSON(): {
        idGradeHorario: string;
        turma: string;
        horaInicio: number;
        horaFim: number;
        dia: string;
        cod: string;
        disciplina: string;
        auditoria: Auditoria;
    };
}
//# sourceMappingURL=GradeHorario.d.ts.map