import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { GradeHorarioDAO } from "../dao/GradeHorarioDAO";
import { Funcionario } from "@/models/Funcionario";
import { ErrorResponse } from "@/http/ErrorResponse";
import { ConfiguracaoAlertaFaltaDAO } from "@/dao/ConfiguracaoAlertaFaltaDAO";
import { AlertaFaltaDAO } from "@/dao/AlertaFaltaDAO";

export interface FrequenciaAluno {
    matricula: string;
    alunoNome: string;
    situacao: string;
}

export interface FaltasPorAluno {
    matricula: string;
    alunoNome: string;
    totalFaltas: number;
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
    private _gradeHorarioDAO: GradeHorarioDAO;
    private _configuracaoAlertaFaltaDAO: ConfiguracaoAlertaFaltaDAO;
    private _alertaFaltaDAO: AlertaFaltaDAO;

    constructor(
        alunoDAODependency: AlunoDAO,
        registroDAODependency: RegistroDAO,
        gradeHorarioDAODependency: GradeHorarioDAO,
        configuracaoAlertaFaltaDAODependency: ConfiguracaoAlertaFaltaDAO,
        alertaFaltaDAODependency: AlertaFaltaDAO
    ) {
        console.log("⬆️  RelatorioService.constructor()");
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
        this._gradeHorarioDAO = gradeHorarioDAODependency;
        this._configuracaoAlertaFaltaDAO = configuracaoAlertaFaltaDAODependency;
        this._alertaFaltaDAO = alertaFaltaDAODependency;
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

    //frequência de uma turma num dia: busca os alunos da turma, depois os registros do dia, e interpola via software
    public frequenciaPorTurma = async (turma: string, dia: Date): Promise<FrequenciaAluno[]> => {
        console.log("🟣 RelatorioService.frequenciaPorTurma()");

        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dia, dia);
        const todosRegistros = await this._registroDAO.findAll();

        return alunosDaTurma.map(aluno => {
            const registroDoDia = todosRegistros.find(registro =>
                registro.matricula === aluno.matricula &&
                registro.turma === turma &&
                registro.dia.toDateString() === dia.toDateString()
            );

            let situacao = "Pendente";
            if (registroDoDia) {
                if (registroDoDia.situacao !== "Normal") {
                    situacao = registroDoDia.situacao;
                } else {
                    situacao = registroDoDia.falta ? "Ausente" : "Presente";
                }
            }

            return {
                matricula: aluno.matricula,
                alunoNome: aluno.alunoNome,
                situacao
            };
        });
    };

    //faltas de uma turma num período (usado por semana/mês/período customizado)
    public faltasPorTurmaEPeriodo = async (turma: string, dataInicio: Date, dataFim: Date): Promise<FaltasPorAluno[]> => {
        console.log("🟣 RelatorioService.faltasPorTurmaEPeriodo()");

        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dataInicio, dataFim);
        const todosRegistros = await this._registroDAO.findAll();

        const registrosNoPeriodo = todosRegistros.filter((registro: Registro) =>
            registro.turma === turma &&
            registro.dia >= dataInicio && registro.dia <= dataFim && registro.falta === true
        );

        return alunosDaTurma.map(aluno => {
            const totalFaltas = registrosNoPeriodo.filter(registro => registro.matricula === aluno.matricula).length;
            return {
                matricula: aluno.matricula,
                alunoNome: aluno.alunoNome,
                totalFaltas
            };
        });
    };

    //faltas por turma/semana: considera os 7 dias a partir da data informada
    public faltasPorTurmaSemana = async (turma: string, data: Date): Promise<FaltasPorAluno[]> => {
        console.log("🟣 RelatorioService.faltasPorTurmaSemana()");
        const dataFim = new Date(data);
        dataFim.setDate(dataFim.getDate() + 6);
        return await this.faltasPorTurmaEPeriodo(turma, data, dataFim);
    };

    //faltas por turma/mês: considera o mês inteiro da data informada
    public faltasPorTurmaMes = async (turma: string, ano: number, mes: number): Promise<FaltasPorAluno[]> => {
        console.log("🟣 RelatorioService.faltasPorTurmaMes()");
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0, 23, 59, 59);
        return await this.faltasPorTurmaEPeriodo(turma, dataInicio, dataFim);
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
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
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
        const [registros, grades, configuracoes] = await Promise.all([
            this._registroDAO.findFaltasNoPeriodo(dataInicio, dataFim),
            this._gradeHorarioDAO.findAll(),
            this._configuracaoAlertaFaltaDAO.findAll()
        ]);
        const limitesPorCarga = new Map(configuracoes.map(configuracao => [
            configuracao.cargaHorariaSemanalMinutos,
            configuracao.limiteFaltas
        ]));

        const gradesPorTurmaEDia = new Map<string, typeof grades>();
        const gradesPorTurmaEquivalenteEDia = new Map<string, typeof grades>();
        grades.forEach(grade => {
            const dia = this.normalizarDiaSemana(grade.dia);
            const chaveDia = `${this.normalizarTurma(grade.turma)}\u0000${dia}`;
            const aulasDoDia = gradesPorTurmaEDia.get(chaveDia) || [];
            aulasDoDia.push(grade);
            gradesPorTurmaEDia.set(chaveDia, aulasDoDia);

            const chaveEquivalente = `${this.normalizarTurmaEquivalente(grade.turma)}\u0000${dia}`;
            const aulasDaTurmaEquivalente = gradesPorTurmaEquivalenteEDia.get(chaveEquivalente) || [];
            aulasDaTurmaEquivalente.push(grade);
            gradesPorTurmaEquivalenteEDia.set(chaveEquivalente, aulasDaTurmaEquivalente);
        });

        const aulasDaTurmaNoDia = (turma: string, dia: string): typeof grades => {
            const chaveExata = `${this.normalizarTurma(turma)}\u0000${dia}`;
            const aulasExatas = gradesPorTurmaEDia.get(chaveExata) || [];
            if (aulasExatas.length > 0) return aulasExatas;

            const chaveEquivalente = `${this.normalizarTurmaEquivalente(turma)}\u0000${dia}`;
            return gradesPorTurmaEquivalenteEDia.get(chaveEquivalente) || [];
        };

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
            const aulasDoDia = aulasDaTurmaNoDia(registro.turma, diaSemana);
            if (registro.codDisciplina.trim().toUpperCase() !== "GERAL") {
                const gradeDaDisciplina = aulasDoDia.find(grade => grade.cod === registro.codDisciplina);
                if (gradeDaDisciplina) registrarFaltaDaDisciplina(registro, gradeDaDisciplina);
                return;
            }

            const codigosDaChamada = new Set<string>();
            aulasDoDia.forEach(grade => {
                if (codigosDaChamada.has(grade.cod)) return;
                codigosDaChamada.add(grade.cod);
                registrarFaltaDaDisciplina(registro, grade);
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
        return resultado;
    };
}
