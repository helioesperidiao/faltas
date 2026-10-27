"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeHorarioService = void 0;
const GradeHorario_1 = require("../models/GradeHorario");
const ErrorResponse_1 = require("../http/ErrorResponse");
class GradeHorarioService {
    _gradeHorarioDAO;
    constructor(gradeHorarioDAODependency) {
        console.log("⬆️  GradeHorarioService.constructor()");
        this._gradeHorarioDAO = gradeHorarioDAODependency;
    }
    create = async (grade, funcionarioLogado) => {
        console.log("🟣 GradeHorarioService.create()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar grade de horário.` });
        }
        return await this._gradeHorarioDAO.create(grade, funcionarioLogado);
    };
    substituirImportacao = async (gradesImportadas, funcionarioLogado) => {
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode importar a grade oficial."
            });
        }
        if (gradesImportadas.length === 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "A planilha não contém aulas para importar.");
        }
        const chave = (grade) => [grade.turma, grade.horaInicio, grade.horaFim, grade.dia, grade.cod]
            .map(valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim())
            .join('\u0000');
        const chavesImportadas = new Set();
        gradesImportadas.forEach(grade => {
            const identificador = chave(grade);
            if (chavesImportadas.has(identificador)) {
                throw new ErrorResponse_1.ErrorResponse(400, `A aula ${grade.turma} ${grade.dia} ${grade.horaInicio} já aparece na planilha.`);
            }
            chavesImportadas.add(identificador);
        });
        const gradesAtivas = await this._gradeHorarioDAO.findAll();
        const gradesPorChave = new Map(gradesAtivas.map(grade => [chave(grade), grade]));
        let criadas = 0;
        let atualizadas = 0;
        for (const gradeImportada of gradesImportadas) {
            const gradeExistente = gradesPorChave.get(chave(gradeImportada));
            if (!gradeExistente) {
                await this._gradeHorarioDAO.create(gradeImportada, funcionarioLogado);
                criadas += 1;
                continue;
            }
            gradeImportada.idGradeHorario = gradeExistente.idGradeHorario;
            await this._gradeHorarioDAO.update(gradeImportada, funcionarioLogado);
            atualizadas += 1;
        }
        let arquivadas = 0;
        for (const gradeAtiva of gradesAtivas) {
            if (chavesImportadas.has(chave(gradeAtiva)))
                continue;
            if (await this._gradeHorarioDAO.delete(gradeAtiva, funcionarioLogado)) {
                arquivadas += 1;
            }
        }
        return { criadas, atualizadas, arquivadas };
    };
    findAll = async () => {
        console.log("🟣 GradeHorarioService.findAll()");
        return await this._gradeHorarioDAO.findAll();
    };
    findById = async (idGradeHorario) => {
        console.log("🟣 GradeHorarioService.findById()");
        const grade = new GradeHorario_1.GradeHorario();
        grade.idGradeHorario = idGradeHorario;
        return await this._gradeHorarioDAO.findById(grade.idGradeHorario);
    };
    findByTurma = async (turma) => {
        console.log("🟣 GradeHorarioService.findByTurma()");
        return await this._gradeHorarioDAO.findByField("turma", turma);
    };
    findAllDeleted = async (funcionarioLogado) => {
        console.log("🟣 GradeHorarioService.findAllDeleted()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar grades deletadas.` });
        }
        return await this._gradeHorarioDAO.findAllDeleted();
    };
    update = async (grade, funcionarioLogado) => {
        console.log("🟣 GradeHorarioService.update()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar grade de horário.` });
        }
        return await this._gradeHorarioDAO.update(grade, funcionarioLogado);
    };
    delete = async (grade, funcionarioLogado) => {
        console.log("🟣 GradeHorarioService.delete()");
        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir grade de horário.` });
        }
        return await this._gradeHorarioDAO.delete(grade, funcionarioLogado);
    };
    count = async () => {
        console.log("🟣 GradeHorarioService.count()");
        return await this._gradeHorarioDAO.count();
    };
}
exports.GradeHorarioService = GradeHorarioService;
//# sourceMappingURL=GradeHorarioService.js.map