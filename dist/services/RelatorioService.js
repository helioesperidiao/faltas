"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioService = void 0;
class RelatorioService {
    _alunoDAO;
    _registroDAO;
    _movimentacaoDAO;
    constructor(alunoDAODependency, registroDAODependency, movimentacaoDAODependency) {
        console.log("⬆️  RelatorioService.constructor()");
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
        this._movimentacaoDAO = movimentacaoDAODependency;
    }
    mesmaData(primeira, segunda) {
        return this.chaveData(primeira) === this.chaveData(segunda);
    }
    chaveData(data) {
        return data.toISOString().slice(0, 10);
    }
    faltaConsiderandoMovimentacao(registro, movimentacoes) {
        const doAlunoNoDia = movimentacoes
            .filter(movimentacao => movimentacao.matricula === registro.matricula && this.mesmaData(movimentacao.data, registro.dia))
            .sort((a, b) => a.horario.localeCompare(b.horario));
        if (doAlunoNoDia.length === 0)
            return registro.falta;
        if (registro.horaInicio === 0) {
            return doAlunoNoDia[doAlunoNoDia.length - 1].tipo === "saida";
        }
        const horarioDaAula = `${String(registro.horaInicio).padStart(2, "0")}:00`;
        const movimentoAplicavel = doAlunoNoDia.filter(movimentacao => movimentacao.horario <= horarioDaAula).pop();
        return movimentoAplicavel ? movimentoAplicavel.tipo === "saida" : registro.falta;
    }
    ultimaMovimentacao(matricula, movimentacoes, dataInicio, dataFim) {
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
    frequenciaPorTurma = async (turma, dia) => {
        console.log("🟣 RelatorioService.frequenciaPorTurma()");
        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const todosRegistros = await this._registroDAO.findAll();
        const movimentacoes = await this._movimentacaoDAO.findAll();
        return alunosDaTurma.map(aluno => {
            const registroDoDia = todosRegistros.find(registro => registro.matricula === aluno.matricula &&
                this.mesmaData(registro.dia, dia));
            let situacao = "Pendente";
            if (registroDoDia) {
                if (registroDoDia.situacao !== "Normal") {
                    situacao = registroDoDia.situacao;
                }
                else {
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
    faltasPorTurmaEPeriodo = async (turma, dataInicio, dataFim) => {
        console.log("🟣 RelatorioService.faltasPorTurmaEPeriodo()");
        const alunosDaTurma = await this._alunoDAO.findByField("turma", turma);
        const todosRegistros = await this._registroDAO.findAll();
        const movimentacoes = await this._movimentacaoDAO.findAll();
        const registrosNoPeriodo = todosRegistros.filter((registro) => registro.dia >= dataInicio && registro.dia <= dataFim && this.faltaConsiderandoMovimentacao(registro, movimentacoes));
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
    faltasPorTurmaSemana = async (turma, data) => {
        console.log("🟣 RelatorioService.faltasPorTurmaSemana()");
        const dataFim = new Date(data);
        dataFim.setDate(dataFim.getDate() + 6);
        return await this.faltasPorTurmaEPeriodo(turma, data, dataFim);
    };
    faltasPorTurmaMes = async (turma, ano, mes) => {
        console.log("🟣 RelatorioService.faltasPorTurmaMes()");
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0, 23, 59, 59);
        return await this.faltasPorTurmaEPeriodo(turma, dataInicio, dataFim);
    };
}
exports.RelatorioService = RelatorioService;
//# sourceMappingURL=RelatorioService.js.map