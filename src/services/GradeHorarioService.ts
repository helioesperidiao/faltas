import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { GradeHorario } from "../models/GradeHorario";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";

export class GradeHorarioService {
    private _gradeHorarioDAO: GradeHorarioDAO;

    constructor(gradeHorarioDAODependency: GradeHorarioDAO) {
        console.log("⬆️  GradeHorarioService.constructor()");
        this._gradeHorarioDAO = gradeHorarioDAODependency;
    }

    public create = async (grade: GradeHorario, funcionarioLogado: Funcionario): Promise<GradeHorario> => {
        console.log("🟣 GradeHorarioService.create()");

        const cargosPermitidos = ["Secretaria", "Administrador", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar grade de horário.` }
            );
        }

        return await this._gradeHorarioDAO.create(grade, funcionarioLogado);
    };

    public findAll = async (): Promise<GradeHorario[]> => {
        console.log("🟣 GradeHorarioService.findAll()");
        return await this._gradeHorarioDAO.findAll();
    };

    public findById = async (idGradeHorario: string): Promise<GradeHorario | null> => {
        console.log("🟣 GradeHorarioService.findById()");
        const grade = new GradeHorario();
        grade.idGradeHorario = idGradeHorario;
        return await this._gradeHorarioDAO.findById(grade.idGradeHorario);
    };

    public findByTurma = async (turma: string): Promise<GradeHorario[]> => {
        console.log("🟣 GradeHorarioService.findByTurma()");
        return await this._gradeHorarioDAO.findByField("turma", turma);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<GradeHorario[]> => {
        console.log("🟣 GradeHorarioService.findAllDeleted()");

        const cargosPermitidos = ["Administrador", "Diretor"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar grades deletadas.` }
            );
        }

        return await this._gradeHorarioDAO.findAllDeleted();
    };

    public update = async (grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 GradeHorarioService.update()");

        const cargosPermitidos = ["Secretaria", "Administrador", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar grade de horário.` }
            );
        }

        return await this._gradeHorarioDAO.update(grade, funcionarioLogado);
    };

    public delete = async (grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log("🟣 GradeHorarioService.delete()");

        const cargosPermitidos = ["Secretaria", "Administrador", "Coordenador"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir grade de horário.` }
            );
        }

        return await this._gradeHorarioDAO.delete(grade, funcionarioLogado);
    };

    public count = async (): Promise<number> => {
        console.log("🟣 GradeHorarioService.count()");
        return await this._gradeHorarioDAO.count();
    };
}
