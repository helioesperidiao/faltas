"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioService = void 0;
const ErrorResponse_1 = require("@/http/ErrorResponse");
class RelatorioService {
    _alunoDAO;
    _registroDAO;
    _movimentacaoDAO;
    _gradeHorarioDAO;
    _configuracaoAlertaFaltaDAO;
    _alertaFaltaDAO;
    constructor(alunoDAODependency, registroDAODependency, movimentacaoDAODependency, gradeHorarioDAODependency, configuracaoAlertaFaltaDAODependency, alertaFaltaDAODependency) {
        console.log("⬆️  RelatorioService.constructor()");
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
        this._movimentacaoDAO = movimentacaoDAODependency;
        this._gradeHorarioDAO = gradeHorarioDAODependency;
        this._configuracaoAlertaFaltaDAO = configuracaoAlertaFaltaDAODependency;
        this._alertaFaltaDAO = alertaFaltaDAODependency;
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
        if (registro.horaInicio === 0)
            return doAlunoNoDia[doAlunoNoDia.length - 1].tipo === "saida";
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
    normalizarDiaSemana = (valor) => {
        const texto = String(valor || '')
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
    diaSemanaDaData = (data) => {
        const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        return dias[data.getUTCDay()];
    };
    normalizarTurma = (valor) => String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    normalizarTurmaEquivalente = (valor) => this.normalizarTurma(valor).replace(/^(etec|econ)/, '');
    frequenciaPorTurma = async (turma, dia) => {
        console.log("🟣 RelatorioService.frequenciaPorTurma()");
        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dia, dia);
        const todosRegistros = await this._registroDAO.findAll();
        const movimentacoes = await this._movimentacaoDAO.findAll();
        return alunosDaTurma.map(aluno => {
            const registroDoDia = todosRegistros.find(registro => registro.matricula === aluno.matricula &&
                registro.turma === turma &&
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
        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dataInicio, dataFim);
        const todosRegistros = await this._registroDAO.findAll();
        const movimentacoes = await this._movimentacaoDAO.findAll();
        const registrosNoPeriodo = todosRegistros.filter((registro) => registro.turma === turma &&
            registro.dia >= dataInicio && registro.dia <= dataFim && this.faltaConsiderandoMovimentacao(registro, movimentacoes));
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
    alertasFaltaBimestral = async (ano, bimestre, funcionarioLogado) => {
        if (funcionarioLogado.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", {
                message: "Apenas Processo Pedagógico pode consultar os alertas de faltas."
            });
        }
        if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || !Number.isInteger(bimestre) || bimestre < 1 || bimestre > 4) {
            throw new ErrorResponse_1.ErrorResponse(400, "Ano ou bimestre inválido.");
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
        const gradesPorTurmaEDia = new Map();
        const gradesPorTurmaEquivalenteEDia = new Map();
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
        const aulasDaTurmaNoDia = (turma, dia) => {
            const chaveExata = `${this.normalizarTurma(turma)}\u0000${dia}`;
            const aulasExatas = gradesPorTurmaEDia.get(chaveExata) || [];
            if (aulasExatas.length > 0)
                return aulasExatas;
            const chaveEquivalente = `${this.normalizarTurmaEquivalente(turma)}\u0000${dia}`;
            return gradesPorTurmaEquivalenteEDia.get(chaveEquivalente) || [];
        };
        const faltasPorAlunoEDisciplina = new Map();
        const registrarFaltaDaDisciplina = (registro, grade) => {
            const chave = `${registro.matricula}\u0000${registro.turma}\u0000${grade.turma}\u0000${grade.cod}`;
            const falta = faltasPorAlunoEDisciplina.get(chave) || {
                registro,
                codDisciplina: grade.cod,
                disciplina: grade.disciplina,
                cargaHorariaSemanalMinutos: grade.cargaHorariaSemanalMinutos,
                totalFaltas: 0
            };
            falta.totalFaltas += 1;
            faltasPorAlunoEDisciplina.set(chave, falta);
        };
        registros.forEach(registro => {
            const diaSemana = this.diaSemanaDaData(registro.dia);
            const aulasDoDia = aulasDaTurmaNoDia(registro.turma, diaSemana);
            if (registro.codDisciplina.trim().toUpperCase() !== "GERAL") {
                const gradeDaDisciplina = aulasDoDia.find(grade => grade.cod === registro.codDisciplina);
                if (gradeDaDisciplina)
                    registrarFaltaDaDisciplina(registro, gradeDaDisciplina);
                return;
            }
            const codigosDaChamada = new Set();
            aulasDoDia.forEach(grade => {
                if (codigosDaChamada.has(grade.cod))
                    return;
                codigosDaChamada.add(grade.cod);
                registrarFaltaDaDisciplina(registro, grade);
            });
        });
        const alertas = [];
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
exports.RelatorioService = RelatorioService;
//# sourceMappingURL=RelatorioService.js.map