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

        const disciplinas = new Map<string, { disciplina: string; carga: number }>();
        grades.forEach(grade => {
            disciplinas.set(`${grade.turma}\u0000${grade.cod}`, {
                disciplina: grade.disciplina,
                carga: grade.cargaHorariaSemanalMinutos
            });
        });

        const faltasPorAlunoEDisciplina = new Map<string, Registro[]>();
        registros.forEach(registro => {
            const chaveDisciplina = `${registro.turma}\u0000${registro.codDisciplina}`;
            if (!disciplinas.has(chaveDisciplina)) return;
            const chave = `${registro.matricula}\u0000${chaveDisciplina}`;
            const faltas = faltasPorAlunoEDisciplina.get(chave) || [];
            faltas.push(registro);
            faltasPorAlunoEDisciplina.set(chave, faltas);
        });

        const alertas: AlertaFaltaBimestral[] = [];
        faltasPorAlunoEDisciplina.forEach(faltas => {
            const registro = faltas[0];
            const detalheDisciplina = disciplinas.get(`${registro.turma}\u0000${registro.codDisciplina}`)!;
            const limiteFaltas = limitesPorCarga.get(detalheDisciplina.carga) || 0;

            if (limiteFaltas > 0 && faltas.length >= limiteFaltas) {
                alertas.push({
                    matricula: registro.matricula,
                    alunoNome: registro.alunoNome,
                    turma: registro.turma,
                    codDisciplina: registro.codDisciplina,
                    disciplina: detalheDisciplina.disciplina,
                    totalFaltas: faltas.length,
                    cargaHorariaSemanalMinutos: detalheDisciplina.carga,
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
