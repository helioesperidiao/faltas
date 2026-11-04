import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { GradeHorario } from "../models/GradeHorario";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("GradeHorarioService");

export class GradeHorarioService {
    private _gradeHorarioDAO: GradeHorarioDAO;

    constructor(gradeHorarioDAODependency: GradeHorarioDAO) {
        this._gradeHorarioDAO = gradeHorarioDAODependency;
    }

    public create = async (grade: GradeHorario, funcionarioLogado: Funcionario): Promise<GradeHorario> => {
        log.debug("create()", { turma: grade.turma, cod: grade.cod, dia: grade.dia });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("criação de grade negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar grade de horário.` }
            );
        }

        const criada = await this._gradeHorarioDAO.create(grade, funcionarioLogado);
        log.info("grade de horário criada", {
            idGradeHorario: criada.idGradeHorario,
            turma: criada.turma,
            cod: criada.cod,
            criadaPor: funcionarioLogado.email,
        });
        return criada;
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
        log.debug("findAll()");
        return await this._gradeHorarioDAO.findAll();
    };

    public findById = async (idGradeHorario: string): Promise<GradeHorario | null> => {
        log.debug("findById()", { idGradeHorario });
        const grade = new GradeHorario();
        grade.idGradeHorario = idGradeHorario;
        return await this._gradeHorarioDAO.findById(grade.idGradeHorario);
    };

    public findByTurma = async (turma: string): Promise<GradeHorario[]> => {
        log.debug("findByTurma()", { turma });
        return await this._gradeHorarioDAO.findByField("turma", turma);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<GradeHorario[]> => {
        log.debug("findAllDeleted()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("busca de grades deletadas negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar grades deletadas.` }
            );
        }

        return await this._gradeHorarioDAO.findAllDeleted();
    };

    public update = async (grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idGradeHorario: grade.idGradeHorario });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("atualização de grade negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar grade de horário.` }
            );
        }

        const atualizou = await this._gradeHorarioDAO.update(grade, funcionarioLogado);
        if (atualizou) {
            log.info("grade de horário atualizada", {
                idGradeHorario: grade.idGradeHorario,
                atualizadaPor: funcionarioLogado.email,
            });
        }
        return atualizou;
    };

    public delete = async (grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idGradeHorario: grade.idGradeHorario });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("exclusão de grade negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir grade de horário.` }
            );
        }

        const excluiu = await this._gradeHorarioDAO.delete(grade, funcionarioLogado);
        if (excluiu) {
            log.info("grade de horário excluída", {
                idGradeHorario: grade.idGradeHorario,
                excluidaPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    public count = async (): Promise<number> => {
        log.debug("count()");
        return await this._gradeHorarioDAO.count();
    };
}