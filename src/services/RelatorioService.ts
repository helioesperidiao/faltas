import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { Movimentacao } from "../models/Movimentacao";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";
import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { GradeHorario } from "../models/GradeHorario";
import { Funcionario } from "@/models/Funcionario";
import { ErrorResponse } from "@/http/ErrorResponse";
import { ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { AlertaFaltaDAO } from "@/dao/AlertaFaltaDAO";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("RelatorioService");

export interface FrequenciaAluno {
    matricula: string;
    alunoNome: string;
    situacao: string;
    movimentacao: { tipo: string; horario: string } | null;
}

export interface FaltasPorAluno {
    matricula: string;
    alunoNome: string;
    totalFaltas: number;
    movimentacao: { tipo: string; horario: string } | null;
}

export interface LinhaFechamentoDia {
    matricula: string;
    alunoNome: string;
    turma: string;
    data: string;
    horario?: string;
    emailPai: string;
}

export interface FaltaHistoricaEscola {
    matricula: string;
    alunoNome: string;
    turma: string;
    data: string;
    ano: number;
    situacao: string;
    emailPai: string;
}

export interface FechamentoDia {
    data: string;
    atrasados: LinhaFechamentoDia[];
    saidasAntecipadas: LinhaFechamentoDia[];
    faltasDoDia: LinhaFechamentoDia[];
    faltasHistoricas: FaltaHistoricaEscola[];
}

export interface AlertaFaltaBimestral {
    matricula: string;
    alunoNome: string;
    turma: string;
    codDisciplina: string;
    disciplina: string;
    totalFaltas: number;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}

export interface AlertasFaltaBimestral {
    ano: number;
    bimestre: number;
    dataInicio: Date;
    dataFim: Date;
    alertas: AlertaFaltaBimestral[];
}

export class RelatorioService {
    private _alunoDAO: AlunoDAO;
    private _registroDAO: RegistroDAO;
    private _movimentacaoDAO: MovimentacaoDAO;
    private _gradeHorarioDAO: GradeHorarioDAO;
    private _configuracaoAlertaFaltaDAO: ConfiguracaoAlertaFaltaDAO;
    private _alertaFaltaDAO: AlertaFaltaDAO;

    constructor(
        alunoDAODependency: AlunoDAO,
        registroDAODependency: RegistroDAO,
        movimentacaoDAODependency: MovimentacaoDAO,
        gradeHorarioDAODependency: GradeHorarioDAO,
        configuracaoAlertaFaltaDAODependency: ConfiguracaoAlertaFaltaDAO,
        alertaFaltaDAODependency: AlertaFaltaDAO
    ) {
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
        this._movimentacaoDAO = movimentacaoDAODependency;
        this._gradeHorarioDAO = gradeHorarioDAODependency;
        this._configuracaoAlertaFaltaDAO = configuracaoAlertaFaltaDAODependency;
        this._alertaFaltaDAO = alertaFaltaDAODependency;
    }

    private mesmaData(primeira: Date, segunda: Date): boolean {
        return this.chaveData(primeira) === this.chaveData(segunda);
    }

    private chaveData(data: Date): string {
        return data.toISOString().slice(0, 10);
    }

    private movimentacoesDoAlunoNoDia(registro: Registro, movimentacoes: Movimentacao[]): Movimentacao[] {
        return movimentacoes
            .filter(movimentacao => movimentacao.matricula === registro.matricula && this.mesmaData(movimentacao.data, registro.dia))
            .sort((a, b) => a.horario.localeCompare(b.horario));
    }

    /**
     * Retorna a situação da aula no seu horário de início. A chamada fornece a
     * situação inicial do dia; cada entrada ou saída registrada até o começo
     * daquela aula atualiza essa situação. Logo, quem entra às 08:40 falta às
     * 07:50 e está presente na aula iniciada às 08:40.
     */
    private faltaNoHorario(registro: Registro, movimentacoes: Movimentacao[], horarioInicio: string): boolean {
        const doAlunoNoDia = this.movimentacoesDoAlunoNoDia(registro, movimentacoes);
        let falta = registro.falta;
        doAlunoNoDia
            .filter(movimentacao => movimentacao.horario <= horarioInicio)
            .forEach(movimentacao => {
                falta = movimentacao.tipo === "saida";
            });
        return falta;
    }

    private faltaConsiderandoMovimentacao(registro: Registro, movimentacoes: Movimentacao[]): boolean {
        const horarioDaAula = `${String(registro.horaInicio).padStart(2, "0")}:00`;
        return this.faltaNoHorario(registro, movimentacoes, horarioDaAula);
    }

    private ultimaMovimentacao(matricula: string, movimentacoes: Movimentacao[], dataInicio?: Date, dataFim?: Date): { tipo: string; horario: string } | null {
        const inicio = dataInicio ? this.chaveData(dataInicio) : null;
        const fim = dataFim ? this.chaveData(dataFim) : null;
        const movimento = movimentacoes
            .filter(item => item.matricula === matricula &&
                (!inicio || this.chaveData(item.data) >= inicio) &&
                (!fim || this.chaveData(item.data) <= fim))
            .sort((a, b) => {
                const dataComparacao = a.data.getTime() - b.data.getTime();
                return dataComparacao || a.horario.localeCompare(b.horario);
            })
            .pop();

        return movimento ? { tipo: movimento.tipo, horario: movimento.horario } : null;
    }

    /** Normaliza os nomes de dia aceitos pela grade, inclusive `quarta-feira`. */
    private normalizarDiaSemana = (valor: string): string => {
        const texto = String(valor || '')
            // Corrige as formas corrompidas mais comuns de dias em XLS legados.
            .replace(/ter\uFFFDa/gi, 'terça')
            .replace(/s\uFFFDbado/gi, 'sábado')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z]+/g, ' ')
            .trim();
        const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        return dias.find(dia => texto === dia || texto.startsWith(`${dia} `)) || texto;
    };

    /** A chamada usa YYYY-MM-DD; UTC evita trocar quinta por quarta no Brasil. */
    private diaSemanaDaData = (data: Date): string => {
        const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        return dias[data.getUTCDay()];
    };

    /**
     * Chave estável para identificar turmas importadas. Alguns arquivos legados
     * usam siglas diferentes para a mesma turma (por exemplo, ETecInf e EConInf).
     */
    private normalizarTurma = (valor: string): string => String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    /**
     * Compatibiliza as siglas históricas sem perder a preferência pela turma
     * idêntica. É usada somente quando a grade não contém o nome exato salvo
     * no registro de chamada.
     */
    private normalizarTurmaEquivalente = (valor: string): string =>
        this.normalizarTurma(valor).replace(/^(etec|econ)/, '');

    /** Recupera a grade exata da turma ou a sigla histórica equivalente. */
    private aulasDaTurmaNoDia(turma: string, dia: string, grades: GradeHorario[]): GradeHorario[] {
        const normalizada = this.normalizarTurma(turma);
        const equivalente = this.normalizarTurmaEquivalente(turma);
        const doMesmoDia = grades.filter(grade => this.normalizarDiaSemana(grade.dia) === dia);
        const aulasExatas = doMesmoDia.filter(grade => this.normalizarTurma(grade.turma) === normalizada);
        return aulasExatas.length > 0
            ? aulasExatas
            : doMesmoDia.filter(grade => this.normalizarTurmaEquivalente(grade.turma) === equivalente);
    }

    /** Indica se a chegada/saída parcial deixou ao menos uma aula ausente no dia. */
    private possuiFaltaNaGradeDoDia(registro: Registro, movimentacoes: Movimentacao[], grades: GradeHorario[]): boolean {
        if (registro.codDisciplina.trim().toUpperCase() !== "GERAL") {
            return this.faltaConsiderandoMovimentacao(registro, movimentacoes);
        }
        const aulas = this.aulasDaTurmaNoDia(registro.turma, this.diaSemanaDaData(registro.dia), grades);
        // Grades ainda não importadas não podem fazer uma ausência geral parecer
        // presença; nesse caso preservamos a situação registrada na chamada.
        if (aulas.length === 0) return registro.falta;
        return aulas.some(aula => this.faltaNoHorario(registro, movimentacoes, aula.horaInicio));
    }

    //frequência de uma turma num dia: busca os alunos da turma, depois os registros do dia, e interpola via software
    public frequenciaPorTurma = async (turma: string, dia: Date): Promise<FrequenciaAluno[]> => {
        log.debug("frequenciaPorTurma()", { turma, dia });

        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dia, dia);
        const [todosRegistros, movimentacoes, grades] = await Promise.all([
            this._registroDAO.findAll(),
            this._movimentacaoDAO.findAll(),
            this._gradeHorarioDAO.findAll()
        ]);

        return alunosDaTurma.map(aluno => {
            const registroDoDia = todosRegistros.find(registro =>
                registro.matricula === aluno.matricula &&
                registro.turma === turma &&
                this.mesmaData(registro.dia, dia)
            );

            let situacao = "Pendente";
            if (registroDoDia) {
                if (registroDoDia.situacao !== "Normal") {
                    situacao = registroDoDia.situacao;
                } else {
                    const possuiFalta = this.possuiFaltaNaGradeDoDia(registroDoDia, movimentacoes, grades);
                    const possuiEntrada = this.movimentacoesDoAlunoNoDia(registroDoDia, movimentacoes)
                        .some(movimentacao => movimentacao.tipo === "entrada");
                    situacao = possuiFalta ? (possuiEntrada ? "Atrasado" : "Ausente") : "Presente";
                }
            }

            return {
                matricula: aluno.matricula,
                alunoNome: aluno.alunoNome,
                situacao,
                movimentacao: this.ultimaMovimentacao(aluno.matricula, movimentacoes, dia, new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59))
            };
        });
    };

    //faltas de uma turma num período (usado por semana/mês/período customizado)
    public faltasPorTurmaEPeriodo = async (turma: string, dataInicio: Date, dataFim: Date): Promise<FaltasPorAluno[]> => {
        log.debug("faltasPorTurmaEPeriodo()", { turma, dataInicio, dataFim });

        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dataInicio, dataFim);
        const [todosRegistros, movimentacoes, grades] = await Promise.all([
            this._registroDAO.findAll(),
            this._movimentacaoDAO.findAll(),
            this._gradeHorarioDAO.findAll()
        ]);

        const registrosNoPeriodo = todosRegistros.filter((registro: Registro) =>
            registro.turma === turma &&
            registro.dia >= dataInicio && registro.dia <= dataFim && this.possuiFaltaNaGradeDoDia(registro, movimentacoes, grades)
        );

        return alunosDaTurma.map(aluno => {
            const totalFaltas = registrosNoPeriodo.filter(registro => registro.matricula === aluno.matricula).length;
            return {
                matricula: aluno.matricula,
                alunoNome: aluno.alunoNome,
                totalFaltas,
                movimentacao: this.ultimaMovimentacao(aluno.matricula, movimentacoes, dataInicio, dataFim)
            };
        });
    };

    //faltas por turma/semana: considera os 7 dias a partir da data informada
    public faltasPorTurmaSemana = async (turma: string, data: Date): Promise<FaltasPorAluno[]> => {
        log.debug("faltasPorTurmaSemana()", { turma, data });
        const dataFim = new Date(data);
        dataFim.setDate(dataFim.getDate() + 6);
        return await this.faltasPorTurmaEPeriodo(turma, data, dataFim);
    };

    //faltas por turma/mês: considera o mês inteiro da data informada
    public faltasPorTurmaMes = async (turma: string, ano: number, mes: number): Promise<FaltasPorAluno[]> => {
        log.debug("faltasPorTurmaMes()", { turma, ano, mes });
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0, 23, 59, 59);
        return await this.faltasPorTurmaEPeriodo(turma, dataInicio, dataFim);
    };

    /**
     * Reúne os dados do encerramento sem alterar as chamadas já registradas.
     * A movimentação de entrada representa atraso e a de saída, saída antecipada.
     */
    public fechamentoDia = async (data: Date): Promise<FechamentoDia> => {
        if (!(data instanceof Date) || isNaN(data.getTime())) {
            throw new ErrorResponse(400, "Data inválida para o fechamento do dia.");
        }

        const [alunos, alunosArquivados, registros, movimentacoesDoDia] = await Promise.all([
            this._alunoDAO.findAll(),
            this._alunoDAO.findAllDeleted(),
            this._registroDAO.findAll(),
            this._movimentacaoDAO.findAll(data)
        ]);
        // Registros históricos podem pertencer a alunos arquivados após uma
        // importação. Mantemos seus contatos para montar os CSVs completos.
        const alunosPorMatricula = new Map([
            ...alunosArquivados.map(aluno => [aluno.matricula, aluno] as const),
            ...alunos.map(aluno => [aluno.matricula, aluno] as const)
        ]);
        const dataFormatada = this.chaveData(data);
        const dadosDoAluno = (matricula: string, nomeRegistrado: string, turmaRegistrada = '') => {
            const aluno = alunosPorMatricula.get(matricula);
            return {
                matricula,
                alunoNome: aluno?.alunoNome || nomeRegistrado,
                turma: turmaRegistrada || aluno?.turma || '',
                emailPai: aluno?.paiEmail || ''
            };
        };
        const compararLinhas = (primeira: LinhaFechamentoDia, segunda: LinhaFechamentoDia): number =>
            primeira.alunoNome.localeCompare(segunda.alunoNome, 'pt-BR') || (primeira.horario || '').localeCompare(segunda.horario || '');

        const atrasados = movimentacoesDoDia
            .filter(movimentacao => movimentacao.tipo === 'entrada')
            .map(movimentacao => ({
                ...dadosDoAluno(movimentacao.matricula, movimentacao.nomeAluno),
                data: dataFormatada,
                horario: movimentacao.horario
            }))
            .sort(compararLinhas);
        const saidasAntecipadas = movimentacoesDoDia
            .filter(movimentacao => movimentacao.tipo === 'saida')
            .map(movimentacao => ({
                ...dadosDoAluno(movimentacao.matricula, movimentacao.nomeAluno),
                data: dataFormatada,
                horario: movimentacao.horario
            }))
            .sort(compararLinhas);
        const faltasValidas = registros.filter(registro =>
            registro.falta === true && !['Abonada', 'Dispensada'].includes(registro.situacao)
        );

        // Uma chamada geral deve aparecer uma única vez por aluno no fechamento,
        // mesmo se a base ainda tiver duplicatas antigas daquela mesma data.
        const faltasDoDiaPorMatricula = new Map<string, LinhaFechamentoDia>();
        faltasValidas
            .filter(registro => this.mesmaData(registro.dia, data))
            .forEach(registro => {
                if (faltasDoDiaPorMatricula.has(registro.matricula)) return;
                faltasDoDiaPorMatricula.set(registro.matricula, {
                    ...dadosDoAluno(registro.matricula, registro.alunoNome, registro.turma),
                    data: dataFormatada
                });
            });
        const faltasDoDia = Array.from(faltasDoDiaPorMatricula.values()).sort(compararLinhas);

        const faltasHistoricas = faltasValidas
            .map(registro => ({
                ...dadosDoAluno(registro.matricula, registro.alunoNome, registro.turma),
                data: this.chaveData(registro.dia),
                ano: registro.ano,
                situacao: registro.situacao
            }))
            .sort((primeira, segunda) => primeira.data.localeCompare(segunda.data) || primeira.alunoNome.localeCompare(segunda.alunoNome, 'pt-BR'));

        return { data: dataFormatada, atrasados, saidasAntecipadas, faltasDoDia, faltasHistoricas };
    };

    /**
     * Lista alunos que atingiram o limite de faltas no bimestre calendário solicitado.
     * O calendário padrão possui quatro períodos letivos: jan-mar, abr-jun, ago-set e
     * out-nov. Julho e dezembro são férias e não entram em nenhum período. Os limites
     * são lidos da tabela de configurações de alertas.
     */
    public alertasFaltaBimestral = async (
        ano: number,
        bimestre: number,
        funcionarioLogado: Funcionario
    ): Promise<AlertasFaltaBimestral> => {
        log.debug("alertasFaltaBimestral()", { ano, bimestre });

        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            log.warn("consulta de alertas negada", {
                motivo: "cargo não autorizado",
                cargoAtor: funcionarioLogado.cargo.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode consultar os alertas de faltas."
            });
        }
        if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || !Number.isInteger(bimestre) || bimestre < 1 || bimestre > 4) {
            throw new ErrorResponse(400, "Ano ou bimestre inválido.");
        }

        const periodos = [
            { inicio: 0, fim: 2 },
            { inicio: 3, fim: 5 },
            { inicio: 7, fim: 8 },
            { inicio: 9, fim: 10 }
        ];
        const periodo = periodos[bimestre - 1];
        const dataInicio = new Date(ano, periodo.inicio, 1);
        const dataFim = new Date(ano, periodo.fim + 1, 0, 23, 59, 59, 999);
        const [todosRegistros, grades, configuracoes, movimentacoes] = await Promise.all([
            this._registroDAO.findAll(),
            this._gradeHorarioDAO.findAll(),
            this._configuracaoAlertaFaltaDAO.findAll(),
            this._movimentacaoDAO.findAll()
        ]);
        const registros = todosRegistros.filter(registro =>
            registro.dia >= dataInicio && registro.dia <= dataFim &&
            !["Abonada", "Dispensada"].includes(registro.situacao)
        );
        const limitesPorCarga = new Map(configuracoes.map(configuracao => [
            configuracao.cargaHorariaSemanalMinutos,
            configuracao.limiteFaltas
        ]));

        // A chamada diária é geral (código GERAL). Para cada ausência, ela é
        // distribuída entre as disciplinas que a turma tinha naquele dia da semana.
        // Registros já abonados ou dispensados foram removidos pela consulta do DAO.
        const faltasPorAlunoEDisciplina = new Map<string, {
            registro: Registro;
            codDisciplina: string;
            disciplina: string;
            cargaHorariaSemanalMinutos: number;
            totalFaltas: number;
        }>();
        const registrarFaltaDaDisciplina = (registro: Registro, grade: typeof grades[number]): void => {
            const chave = `${registro.matricula}\u0000${registro.turma}\u0000${grade.turma}\u0000${grade.cod}`;
            const falta = faltasPorAlunoEDisciplina.get(chave) || {
                registro,
                codDisciplina: grade.cod,
                disciplina: grade.disciplina,
                cargaHorariaSemanalMinutos: grade.cargaHorariaSemanalMinutos,
                totalFaltas: 0
            };
            // Cada registro de chamada representa uma falta. Os dois horários
            // consecutivos da mesma matéria são deduplicados antes deste ponto.
            falta.totalFaltas += 1;
            faltasPorAlunoEDisciplina.set(chave, falta);
        };

        registros.forEach(registro => {
            const diaSemana = this.diaSemanaDaData(registro.dia);
            const aulasDoDia = this.aulasDaTurmaNoDia(registro.turma, diaSemana, grades);
            if (registro.codDisciplina.trim().toUpperCase() !== "GERAL") {
                const gradeDaDisciplina = aulasDoDia.find(grade => grade.cod === registro.codDisciplina);
                if (gradeDaDisciplina && this.faltaNoHorario(registro, movimentacoes, gradeDaDisciplina.horaInicio)) {
                    registrarFaltaDaDisciplina(registro, gradeDaDisciplina);
                }
                return;
            }

            const codigosDaChamada = new Set<string>();
            aulasDoDia.forEach(grade => {
                if (codigosDaChamada.has(grade.cod)) return;
                codigosDaChamada.add(grade.cod);
                if (this.faltaNoHorario(registro, movimentacoes, grade.horaInicio)) {
                    registrarFaltaDaDisciplina(registro, grade);
                }
            });
        });

        const alertas: AlertaFaltaBimestral[] = [];
        faltasPorAlunoEDisciplina.forEach(({ registro, codDisciplina, disciplina, cargaHorariaSemanalMinutos, totalFaltas }) => {
            const limiteFaltas = limitesPorCarga.get(cargaHorariaSemanalMinutos) || 0;

            if (limiteFaltas > 0 && totalFaltas >= limiteFaltas) {
                alertas.push({
                    matricula: registro.matricula,
                    alunoNome: registro.alunoNome,
                    turma: registro.turma,
                    codDisciplina,
                    disciplina,
                    totalFaltas,
                    cargaHorariaSemanalMinutos,
                    limiteFaltas
                });
            }
        });

        const resultado = {
            ano,
            bimestre,
            dataInicio,
            dataFim,
            alertas: alertas.sort((a, b) => a.alunoNome.localeCompare(b.alunoNome, "pt-BR") || a.disciplina.localeCompare(b.disciplina, "pt-BR"))
        };
        await this._alertaFaltaDAO.sincronizar(ano, bimestre, resultado.alertas, funcionarioLogado);
        log.info("alertas bimestrais sincronizados", {
            ano,
            bimestre,
            totalAlertas: resultado.alertas.length,
        });
        return resultado;
    };
}