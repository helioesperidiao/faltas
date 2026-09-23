import { Request, Response } from "express";
import { GradeHorarioService } from "../services/GradeHorarioService";
import { GradeHorario } from "@/models/GradeHorario";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";

export class GradeHorarioController extends BaseController {
    private _gradeHorarioService: GradeHorarioService;

    constructor(gradeHorarioServiceDependency: GradeHorarioService) {
        super();
        console.log("⬆️  GradeHorarioController.constructor()");
        this._gradeHorarioService = gradeHorarioServiceDependency;
    }

    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const dados = request.body.gradeHorario;
        const horaInicio = Number(dados?.horaInicio);
        const horaFim = Number(dados?.horaFim);

        if (!dados || !GradeHorario.isHorarioValido(horaInicio) || !GradeHorario.isHorarioValido(horaFim)) {
            StandardResponse.error("Horários inválidos. Informe horas inteiras ou no formato HHMM.", null, 400).send(response);
            return;
        }

        const novaGrade = new GradeHorario();
<<<<<<< HEAD
        novaGrade.turma = dados.turma;
        novaGrade.horaInicio = horaInicio;
        novaGrade.horaFim = horaFim;
        novaGrade.dia = dados.dia;
        novaGrade.cod = dados.cod;
        novaGrade.disciplina = dados.disciplina;
=======
        novaGrade.turma = request.body.gradeHorario.turma;
        novaGrade.horaInicio = request.body.gradeHorario.horaInicio;
        novaGrade.horaFim = request.body.gradeHorario.horaFim;
        novaGrade.dia = request.body.gradeHorario.dia;
        novaGrade.cod = request.body.gradeHorario.cod;
        novaGrade.disciplina = request.body.gradeHorario.disciplina;
>>>>>>> 8d6eafe6845a986508c399927ba2309a45150037

        const resultado = await this._gradeHorarioService.create(novaGrade, funcionarioLogado);

        StandardResponse.created("Grade de horário cadastrada com sucesso", {
            gradeHorarios: [resultado]
        }).send(response);
    };

    public findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.findAll()");

        const arrayGrades = await this._gradeHorarioService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            gradeHorarios: arrayGrades
        }).send(response);
    };

    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.findAllDeleted()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const gradesDeletadas = await this._gradeHorarioService.findAllDeleted(funcionarioLogado);

        StandardResponse.success("Busca de grades deletadas realizada com sucesso", {
            gradeHorarios: gradesDeletadas
        }).send(response);
    };

    public findById = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.findById()");

        const idGradeHorario = request.params.idGradeHorario.toString();
        const grade = await this._gradeHorarioService.findById(idGradeHorario);

        StandardResponse.success("Executado com sucesso", {
            gradeHorarios: grade
        }).send(response);
    };

    public findByTurma = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.findByTurma()");

        const turma = request.params.turma.toString();
        const grades = await this._gradeHorarioService.findByTurma(turma);

        StandardResponse.success("Executado com sucesso", {
            gradeHorarios: grades
        }).send(response);
    };

    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.update()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const grade = new GradeHorario();
        grade.idGradeHorario = request.params.idGradeHorario.toString();
        grade.turma = request.body.gradeHorario.turma;
        grade.horaInicio = request.body.gradeHorario.horaInicio;
        grade.horaFim = request.body.gradeHorario.horaFim;
        grade.dia = request.body.gradeHorario.dia;
        grade.cod = request.body.gradeHorario.cod;
        grade.disciplina = request.body.gradeHorario.disciplina;

        const atualizou = await this._gradeHorarioService.update(grade, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                gradeHorarios: [grade]
            }).send(response);
        } else {
            StandardResponse.notFound("Grade de horário não encontrada para atualização", {
                gradeHorarios: [grade]
            }).send(response);
        }
    };

    public delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.delete()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const grade = new GradeHorario();
        grade.idGradeHorario = request.params.idGradeHorario.toString();

        const excluiu = await this._gradeHorarioService.delete(grade, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Grade de horário não encontrada para exclusão", {
                gradeHorarios: [{ idGradeHorario: grade.idGradeHorario }]
            }).send(response);
        }
    };

    public count = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 GradeHorarioController.count()");

        const total = await this._gradeHorarioService.count();

        StandardResponse.success("Total de grades obtido", { total }).send(response);
    };
}
