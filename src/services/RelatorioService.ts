import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";
import { Movimentacao } from "../models/Movimentacao";
import { MovimentacaoDAO } from "../dao/MovimentacaoDAO";

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

export class RelatorioService {
    private _alunoDAO: AlunoDAO;
    private _registroDAO: RegistroDAO;
    private _movimentacaoDAO: MovimentacaoDAO;

    constructor(alunoDAODependency: AlunoDAO, registroDAODependency: RegistroDAO, movimentacaoDAODependency: MovimentacaoDAO) {
        console.log("⬆️  RelatorioService.constructor()");
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
        this._movimentacaoDAO = movimentacaoDAODependency;
    }

    private mesmaData(primeira: Date, segunda: Date): boolean {
        return this.chaveData(primeira) === this.chaveData(segunda);
    }

    private chaveData(data: Date): string {
        return data.toISOString().slice(0, 10);
    }

    private faltaConsiderandoMovimentacao(registro: Registro, movimentacoes: Movimentacao[]): boolean {
        const doAlunoNoDia = movimentacoes
            .filter(movimentacao => movimentacao.matricula === registro.matricula && this.mesmaData(movimentacao.data, registro.dia))
            .sort((a, b) => a.horario.localeCompare(b.horario));

        if (doAlunoNoDia.length === 0) return registro.falta;

        // Registros antigos não têm horário; nesses casos, vale o último movimento do dia.
        if (registro.horaInicio === 0) {
            return doAlunoNoDia[doAlunoNoDia.length - 1].tipo === "saida";
        }

        const horarioDaAula = `${String(registro.horaInicio).padStart(2, "0")}:00`;
        const movimentoAplicavel = doAlunoNoDia.filter(movimentacao => movimentacao.horario <= horarioDaAula).pop();
        return movimentoAplicavel ? movimentoAplicavel.tipo === "saida" : registro.falta;
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

    //frequência de uma turma num dia: busca os alunos da turma, depois os registros do dia, e interpola via software
    public frequenciaPorTurma = async (turma: string, dia: Date): Promise<FrequenciaAluno[]> => {
        console.log("🟣 RelatorioService.frequenciaPorTurma()");

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const todosRegistros = await this._registroDAO.findAll();
        const movimentacoes = await this._movimentacaoDAO.findAll();

        return alunosDaTurma.map(aluno => {
            const registroDoDia = todosRegistros.find(registro =>
                registro.matricula === aluno.matricula &&
                this.mesmaData(registro.dia, dia)
            );

            let situacao = "Pendente";
            if (registroDoDia) {
                if (registroDoDia.situacao !== "Normal") {
                    situacao = registroDoDia.situacao;
                } else {
                    situacao = this.faltaConsiderandoMovimentacao(registroDoDia, movimentacoes) ? "Ausente" : "Presente";
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
        console.log("🟣 RelatorioService.faltasPorTurmaEPeriodo()");

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const todosRegistros = await this._registroDAO.findAll();
        const movimentacoes = await this._movimentacaoDAO.findAll();

        const registrosNoPeriodo = todosRegistros.filter((registro: Registro) =>
            registro.dia >= dataInicio && registro.dia <= dataFim && this.faltaConsiderandoMovimentacao(registro, movimentacoes)
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
}
