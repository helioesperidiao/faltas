"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeHorarioController = void 0;
const GradeHorario_1 = require("@/models/GradeHorario");
const StandardResponse_1 = require("@/http/StandardResponse");
const BaseController_1 = require("./BaseController");
class GradeHorarioController extends BaseController_1.BaseController {
    _gradeHorarioService;
    constructor(gradeHorarioServiceDependency) {
        super();
        console.log("⬆️  GradeHorarioController.constructor()");
        this._gradeHorarioService = gradeHorarioServiceDependency;
    }
    montarGrade = (dados) => {
        const grade = new GradeHorario_1.GradeHorario();
        grade.turma = dados.turma;
        grade.horaInicio = dados.horaInicio;
        grade.horaFim = dados.horaFim;
        grade.dia = dados.dia;
        grade.cod = dados.cod;
        grade.disciplina = dados.disciplina;
        return grade;
    };
    create = async (request, response) => {
        console.log("🔵 GradeHorarioController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dados = request.body.gradeHorario;
        const horaInicio = dados?.horaInicio;
        const horaFim = dados?.horaFim;
        if (!dados || !GradeHorario_1.GradeHorario.isHorarioValido(horaInicio) || !GradeHorario_1.GradeHorario.isHorarioValido(horaFim)) {
            StandardResponse_1.StandardResponse.error("Horários inválidos. Informe horas inteiras ou no formato HHMM.", null, 400).send(response);
            return;
        }
        const novaGrade = this.montarGrade(dados);
        const resultado = await this._gradeHorarioService.create(novaGrade, funcionarioLogado);
        StandardResponse_1.StandardResponse.created("Grade de horário cadastrada com sucesso", {
            gradeHorarios: [resultado]
        }).send(response);
    };
    substituirImportacao = async (request, response) => {
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dadosImportados = request.body.gradeHorarios;
        if (!Array.isArray(dadosImportados) || dadosImportados.length === 0) {
            StandardResponse_1.StandardResponse.error("Envie ao menos uma aula para importar.", null, 400).send(response);
            return;
        }
        const possuiHorarioInvalido = dadosImportados.some(dados => !dados || !GradeHorario_1.GradeHorario.isHorarioValido(dados.horaInicio) || !GradeHorario_1.GradeHorario.isHorarioValido(dados.horaFim));
        if (possuiHorarioInvalido) {
            StandardResponse_1.StandardResponse.error("Há horários inválidos na planilha.", null, 400).send(response);
            return;
        }
        const grades = dadosImportados.map(dados => this.montarGrade(dados));
        const resultado = await this._gradeHorarioService.substituirImportacao(grades, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Grade oficial importada com sucesso", resultado).send(response);
    };
    findAll = async (_request, response) => {
        console.log("🔵 GradeHorarioController.findAll()");
        const arrayGrades = await this._gradeHorarioService.findAll();
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            gradeHorarios: arrayGrades
        }).send(response);
    };
    findAllDeleted = async (request, response) => {
        console.log("🔵 GradeHorarioController.findAllDeleted()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const gradesDeletadas = await this._gradeHorarioService.findAllDeleted(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca de grades deletadas realizada com sucesso", {
            gradeHorarios: gradesDeletadas
        }).send(response);
    };
    findById = async (request, response) => {
        console.log("🔵 GradeHorarioController.findById()");
        const idGradeHorario = request.params.idGradeHorario.toString();
        const grade = await this._gradeHorarioService.findById(idGradeHorario);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            gradeHorarios: grade
        }).send(response);
    };
    findByTurma = async (request, response) => {
        console.log("🔵 GradeHorarioController.findByTurma()");
        const turma = request.params.turma.toString();
        const grades = await this._gradeHorarioService.findByTurma(turma);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            gradeHorarios: grades
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 GradeHorarioController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const grade = new GradeHorario_1.GradeHorario();
        grade.idGradeHorario = request.params.idGradeHorario.toString();
        grade.turma = request.body.gradeHorario.turma;
        grade.horaInicio = request.body.gradeHorario.horaInicio;
        grade.horaFim = request.body.gradeHorario.horaFim;
        grade.dia = request.body.gradeHorario.dia;
        grade.cod = request.body.gradeHorario.cod;
        grade.disciplina = request.body.gradeHorario.disciplina;
        const atualizou = await this._gradeHorarioService.update(grade, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                gradeHorarios: [grade]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Grade de horário não encontrada para atualização", {
                gradeHorarios: [grade]
            }).send(response);
        }
    };
    delete = async (request, response) => {
        console.log("🔵 GradeHorarioController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const grade = new GradeHorario_1.GradeHorario();
        grade.idGradeHorario = request.params.idGradeHorario.toString();
        const excluiu = await this._gradeHorarioService.delete(grade, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Grade de horário não encontrada para exclusão", {
                gradeHorarios: [{ idGradeHorario: grade.idGradeHorario }]
            }).send(response);
        }
    };
    count = async (_request, response) => {
        console.log("🔵 GradeHorarioController.count()");
        const total = await this._gradeHorarioService.count();
        StandardResponse_1.StandardResponse.success("Total de grades obtido", { total }).send(response);
    };
}
exports.GradeHorarioController = GradeHorarioController;
//# sourceMappingURL=GradeHorarioController.js.map