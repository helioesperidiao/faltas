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
    movimentacoesDoAlunoNoDia(registro, movimentacoes) {
        return movimentacoes
            .filter(movimentacao => movimentacao.matricula === registro.matricula && this.mesmaData(movimentacao.data, registro.dia))
            .sort((a, b) => a.horario.localeCompare(b.horario));
    }
    faltaNoHorario(registro, movimentacoes, horarioInicio) {
        const doAlunoNoDia = this.movimentacoesDoAlunoNoDia(registro, movimentacoes);
        let falta = registro.falta;
        doAlunoNoDia
            .filter(movimentacao => movimentacao.horario <= horarioInicio)
            .forEach(movimentacao => {
            falta = movimentacao.tipo === "saida";
        });
        return falta;
    }
    faltaConsiderandoMovimentacao(registro, movimentacoes) {
        const horarioDaAula = `${String(registro.horaInicio).padStart(2, "0")}:00`;
        return this.faltaNoHorario(registro, movimentacoes, horarioDaAula);
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
    aulasDaTurmaNoDia(turma, dia, grades) {
        const normalizada = this.normalizarTurma(turma);
        const equivalente = this.normalizarTurmaEquivalente(turma);
        const doMesmoDia = grades.filter(grade => this.normalizarDiaSemana(grade.dia) === dia);
        const aulasExatas = doMesmoDia.filter(grade => this.normalizarTurma(grade.turma) === normalizada);
        return aulasExatas.length > 0
            ? aulasExatas
            : doMesmoDia.filter(grade => this.normalizarTurmaEquivalente(grade.turma) === equivalente);
    }
    possuiFaltaNaGradeDoDia(registro, movimentacoes, grades) {
        if (registro.codDisciplina.trim().toUpperCase() !== "GERAL") {
            return this.faltaConsiderandoMovimentacao(registro, movimentacoes);
        }
        const aulas = this.aulasDaTurmaNoDia(registro.turma, this.diaSemanaDaData(registro.dia), grades);
        if (aulas.length === 0)
            return registro.falta;
        return aulas.some(aula => this.faltaNoHorario(registro, movimentacoes, aula.horaInicio));
    }
    frequenciaPorTurma = async (turma, dia) => {
        console.log("🟣 RelatorioService.frequenciaPorTurma()");
        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dia, dia);
        const [todosRegistros, movimentacoes, grades] = await Promise.all([
            this._registroDAO.findAll(),
            this._movimentacaoDAO.findAll(),
            this._gradeHorarioDAO.findAll()
        ]);
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
    faltasPorTurmaEPeriodo = async (turma, dataInicio, dataFim) => {
        console.log("🟣 RelatorioService.faltasPorTurmaEPeriodo()");
        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dataInicio, dataFim);
        const [todosRegistros, movimentacoes, grades] = await Promise.all([
            this._registroDAO.findAll(),
            this._movimentacaoDAO.findAll(),
            this._gradeHorarioDAO.findAll()
        ]);
        const registrosNoPeriodo = todosRegistros.filter((registro) => registro.turma === turma &&
            registro.dia >= dataInicio && registro.dia <= dataFim && this.possuiFaltaNaGradeDoDia(registro, movimentacoes, grades));
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
    fechamentoDia = async (data) => {
        if (!(data instanceof Date) || isNaN(data.getTime())) {
            throw new ErrorResponse_1.ErrorResponse(400, "Data inválida para o fechamento do dia.");
        }
        const [alunos, alunosArquivados, registros, movimentacoesDoDia] = await Promise.all([
            this._alunoDAO.findAll(),
            this._alunoDAO.findAllDeleted(),
            this._registroDAO.findAll(),
            this._movimentacaoDAO.findAll(data)
        ]);
        const alunosPorMatricula = new Map([
            ...alunosArquivados.map(aluno => [aluno.matricula, aluno]),
            ...alunos.map(aluno => [aluno.matricula, aluno])
        ]);
        const dataFormatada = this.chaveData(data);
        const dadosDoAluno = (matricula, nomeRegistrado, turmaRegistrada = '') => {
            const aluno = alunosPorMatricula.get(matricula);
            return {
                matricula,
                alunoNome: aluno?.alunoNome || nomeRegistrado,
                turma: turmaRegistrada || aluno?.turma || '',
                emailPai: aluno?.paiEmail || ''
            };
        };
        const compararLinhas = (primeira, segunda) => primeira.alunoNome.localeCompare(segunda.alunoNome, 'pt-BR') || (primeira.horario || '').localeCompare(segunda.horario || '');
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
        const faltasValidas = registros.filter(registro => registro.falta === true && !['Abonada', 'Dispensada'].includes(registro.situacao));
        const faltasDoDiaPorMatricula = new Map();
        faltasValidas
            .filter(registro => this.mesmaData(registro.dia, data))
            .forEach(registro => {
            if (faltasDoDiaPorMatricula.has(registro.matricula))
                return;
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
        const [todosRegistros, grades, configuracoes, movimentacoes] = await Promise.all([
            this._registroDAO.findAll(),
            this._gradeHorarioDAO.findAll(),
            this._configuracaoAlertaFaltaDAO.findAll(),
            this._movimentacaoDAO.findAll()
        ]);
        const registros = todosRegistros.filter(registro => registro.dia >= dataInicio && registro.dia <= dataFim &&
            !["Abonada", "Dispensada"].includes(registro.situacao));
        const limitesPorCarga = new Map(configuracoes.map(configuracao => [
            configuracao.cargaHorariaSemanalMinutos,
            configuracao.limiteFaltas
        ]));
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
            const aulasDoDia = this.aulasDaTurmaNoDia(registro.turma, diaSemana, grades);
            if (registro.codDisciplina.trim().toUpperCase() !== "GERAL") {
                const gradeDaDisciplina = aulasDoDia.find(grade => grade.cod === registro.codDisciplina);
                if (gradeDaDisciplina && this.faltaNoHorario(registro, movimentacoes, gradeDaDisciplina.horaInicio)) {
                    registrarFaltaDaDisciplina(registro, gradeDaDisciplina);
                }
                return;
            }
            const codigosDaChamada = new Set();
            aulasDoDia.forEach(grade => {
                if (codigosDaChamada.has(grade.cod))
                    return;
                codigosDaChamada.add(grade.cod);
                if (this.faltaNoHorario(registro, movimentacoes, grade.horaInicio)) {
                    registrarFaltaDaDisciplina(registro, grade);
                }
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