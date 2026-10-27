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

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar grade de horário.` }
            );
        }

        return await this._gradeHorarioDAO.create(grade, funcionarioLogado);
    };

    /** Substitui a grade ativa pela nova planilha, preservando a versão antiga como exclusão lógica. */
    public substituirImportacao = async (gradesImportadas: GradeHorario[], funcionarioLogado: Funcionario): Promise<{
        criadas: number;
        atualizadas: number;
        arquivadas: number;
    }> => {
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode importar a grade oficial."
            });
        }
        if (gradesImportadas.length === 0) {
            throw new ErrorResponse(400, "A planilha não contém aulas para importar.");
        }

        const chave = (grade: GradeHorario): string => [grade.turma, grade.horaInicio, grade.horaFim, grade.dia, grade.cod]
            .map(valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim())
            .join('\u0000');
        const chavesImportadas = new Set<string>();
        gradesImportadas.forEach(grade => {
            const identificador = chave(grade);
            if (chavesImportadas.has(identificador)) {
                throw new ErrorResponse(400, `A aula ${grade.turma} ${grade.dia} ${grade.horaInicio} já aparece na planilha.`);
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
            if (chavesImportadas.has(chave(gradeAtiva))) continue;
            if (await this._gradeHorarioDAO.delete(gradeAtiva, funcionarioLogado)) {
                arquivadas += 1;
            }
        }
        return { criadas, atualizadas, arquivadas };
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

        const cargosPermitidos = ["Processo Pedagógico"];
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

        const cargosPermitidos = ["Processo Pedagógico"];
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

        const cargosPermitidos = ["Processo Pedagógico"];
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
