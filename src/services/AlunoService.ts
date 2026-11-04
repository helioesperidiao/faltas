import { AlunoDAO } from "../dao/AlunoDAO";
import { Aluno } from "../models/Aluno";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "@/models/Funcionario";
import { HistoricoTurma } from "@/models/HistoricoTurma";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("AlunoService");

export class AlunoService {
    private _alunoDAO: AlunoDAO;

    constructor(alunoDAODependency: AlunoDAO) {
        this._alunoDAO = alunoDAODependency;
    }

    public create = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<Aluno> => {
        log.debug("create()", { matricula: aluno.matricula, turma: aluno.turma });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("criação de aluno negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode cadastrar alunos.` }
            );
        }

        const jaExiste = await this._alunoDAO.findByField("matricula", aluno.matricula);
        if (jaExiste && jaExiste.length > 0) {
            throw new ErrorResponse(400, "Já existe um aluno com esta matrícula");
        }

        const criado = await this._alunoDAO.create(aluno, funcionarioLogado);
        log.info("aluno criado", {
            idAluno: criado.idAluno,
            matricula: criado.matricula,
            turma: criado.turma,
            criadoPor: funcionarioLogado.email,
        });
        return criado;
    };

    /**
     * Aplica uma planilha oficial inteira. Cadastros ausentes na nova lista são
     * arquivados logicamente; assim, deixam de formar turmas ativas sem apagar
     * histórico, faltas ou qualquer outro registro já existente.
     */
    public substituirImportacao = async (alunosImportados: Aluno[], funcionarioLogado: Funcionario): Promise<{
        criados: number;
        atualizados: number;
        arquivados: number;
    }> => {
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode importar a lista oficial de alunos."
            });
        }
        if (alunosImportados.length === 0) {
            throw new ErrorResponse(400, "A planilha não contém alunos para importar.");
        }

        const matriculasImportadas = new Set<string>();
        alunosImportados.forEach(aluno => {
            if (matriculasImportadas.has(aluno.matricula)) {
                throw new ErrorResponse(400, `A matrícula ${aluno.matricula} aparece mais de uma vez na planilha.`);
            }
            matriculasImportadas.add(aluno.matricula);
        });

        const alunosAtivos = await this._alunoDAO.findAll();
        const alunosPorMatricula = new Map(alunosAtivos.map(aluno => [aluno.matricula, aluno]));
        let criados = 0;
        let atualizados = 0;

        for (const alunoImportado of alunosImportados) {
            const alunoExistente = alunosPorMatricula.get(alunoImportado.matricula);
            if (!alunoExistente) {
                await this._alunoDAO.create(alunoImportado, funcionarioLogado);
                criados += 1;
                continue;
            }

            alunoImportado.idAluno = alunoExistente.idAluno;
            await this.update(alunoImportado, funcionarioLogado);
            atualizados += 1;
        }

        let arquivados = 0;
        for (const alunoAtivo of alunosAtivos) {
            if (matriculasImportadas.has(alunoAtivo.matricula)) continue;
            if (await this._alunoDAO.delete(alunoAtivo, funcionarioLogado)) {
                arquivados += 1;
            }
        }

        return { criados, atualizados, arquivados };
    };

    public findAll = async (): Promise<Aluno[]> => {
        log.debug("findAll()");
        return await this._alunoDAO.findAll();
    };

    public findById = async (idAluno: string): Promise<Aluno | null> => {
        log.debug("findById()", { idAluno });
        const aluno = new Aluno();
        aluno.idAluno = idAluno;
        return await this._alunoDAO.findById(aluno.idAluno);
    };

    public findByMatricula = async (matricula: string): Promise<Aluno | null> => {
        log.debug("findByMatricula()", { matricula });
        const resultado = await this._alunoDAO.findByField("matricula", matricula);
        return resultado.length > 0 ? resultado[0] : null;
    };

    public findByTurma = async (turma: string): Promise<Aluno[]> => {
        log.debug("findByTurma()", { turma });
        return await this._alunoDAO.findByField("turma", turma);
    };

    public findAllDeleted = async (funcionarioLogado: Funcionario): Promise<Aluno[]> => {
        log.debug("findAllDeleted()");

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("busca de alunos deletados negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `Apenas ${cargosPermitidos.join(" ou ")} podem visualizar alunos deletados.` }
            );
        }

        return await this._alunoDAO.findAllDeleted();
    };

    public update = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idAluno: aluno.idAluno });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("atualização de aluno negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode alterar alunos.` }
            );
        }

        const alunoAnterior = await this._alunoDAO.findById(aluno.idAluno);
        if (!alunoAnterior) {
            return false;
        }

        aluno.historicoTurmas = alunoAnterior.historicoTurmas;
        aluno.turmaInicioEm = alunoAnterior.turmaInicioEm;

        if (this.alterouEnturmacao(alunoAnterior, aluno)) {
            aluno.historicoTurmas = [
                ...alunoAnterior.historicoTurmas,
                this.criarHistorico(alunoAnterior)
            ];
            aluno.turmaInicioEm = new Date();
            log.info("enturmação alterada; histórico preservado", {
                idAluno: aluno.idAluno,
                turmaAnterior: alunoAnterior.turma,
                turmaNova: aluno.turma,
            });
        }

        const atualizou = await this._alunoDAO.update(aluno, funcionarioLogado);
        if (atualizou) {
            log.info("aluno atualizado", {
                idAluno: aluno.idAluno,
                atualizadoPor: funcionarioLogado.email,
            });
        }
        return atualizou;
    };

    /** Atualiza uma turma inteira na virada do ano sem recriar cadastros. */
    public promoverTurma = async (
        turmaOrigem: string,
        turmaDestino: string,
        anoDestino: string,
        serieDestino: string,
        funcionarioLogado: Funcionario
    ): Promise<number> => {
        log.debug("promoverTurma()", { turmaOrigem, turmaDestino, anoDestino });

        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            log.warn("virada anual negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode executar a virada anual de turma."
            });
        }

        const alunos = await this._alunoDAO.findByField("turma", turmaOrigem);
        for (const aluno of alunos) {
            aluno.historicoTurmas = [...aluno.historicoTurmas, this.criarHistorico(aluno)];
            aluno.turma = turmaDestino;
            aluno.ano = anoDestino;
            if (serieDestino) {
                aluno.serie = serieDestino;
            }
            aluno.turmaInicioEm = new Date();
        }

        const total = await this._alunoDAO.atualizarEnturmacaoEmLote(alunos, funcionarioLogado);
        log.info("virada anual concluída", {
            turmaOrigem,
            turmaDestino,
            totalMovido: total,
            executadoPor: funcionarioLogado.email,
        });
        return total;
    };

    private alterouEnturmacao(anterior: Aluno, atualizado: Aluno): boolean {
        return anterior.turma !== atualizado.turma ||
            anterior.curso !== atualizado.curso ||
            anterior.serie !== atualizado.serie ||
            anterior.ano !== atualizado.ano;
    }

    private criarHistorico(aluno: Aluno): HistoricoTurma {
        const fimEm = new Date();
        const disponivelAte = new Date(fimEm);
        disponivelAte.setFullYear(disponivelAte.getFullYear() + 1);

        return {
            turma: aluno.turma,
            curso: aluno.curso,
            serie: aluno.serie,
            ano: aluno.ano,
            inicioEm: aluno.turmaInicioEm,
            fimEm,
            disponivelAte
        };
    }

    public delete = async (aluno: Aluno, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idAluno: aluno.idAluno });

        const cargosPermitidos = ["Processo Pedagógico"];
        if (!cargosPermitidos.includes(funcionarioLogado.cargo.nomeCargo)) {
            log.warn("exclusão de aluno negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(
                403,
                "Não autorizado",
                { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não pode excluir alunos.` }
            );
        }

        const excluiu = await this._alunoDAO.delete(aluno, funcionarioLogado);
        if (excluiu) {
            log.info("aluno excluído", {
                idAluno: aluno.idAluno,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    public count = async (): Promise<number> => {
        log.debug("count()");
        return await this._alunoDAO.count();
    };
}