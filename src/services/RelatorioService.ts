import { AlunoDAO } from "../dao/AlunoDAO";
import { RegistroDAO } from "../dao/RegistroDAO";
import { Registro } from "../models/Registro";

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

export class RelatorioService {
    private _alunoDAO: AlunoDAO;
    private _registroDAO: RegistroDAO;

    constructor(alunoDAODependency: AlunoDAO, registroDAODependency: RegistroDAO) {
        console.log("⬆️  RelatorioService.constructor()");
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
    }

    //frequência de uma turma num dia: busca os alunos da turma, depois os registros do dia, e interpola via software
    public frequenciaPorTurma = async (turma: string, dia: Date): Promise<FrequenciaAluno[]> => {
        console.log("🟣 RelatorioService.frequenciaPorTurma()");

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const todosRegistros = await this._registroDAO.findAll();

        return alunosDaTurma.map(aluno => {
            const registroDoDia = todosRegistros.find(registro =>
                registro.matricula === aluno.matricula &&
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

        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const todosRegistros = await this._registroDAO.findAll();

        const registrosNoPeriodo = todosRegistros.filter((registro: Registro) =>
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
}
