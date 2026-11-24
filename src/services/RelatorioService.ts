import { AbonoDAO } from "../dao/AbonoDAO";
import { DispensaDAO } from "../dao/DispensaDAO";
import { Dispensa } from "../models/Dispensa";
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

export interface FaltaPorAula {
    ano: number;
    codDisciplina: string;
    data: string;
    horarioInicio: string;
    matricula: string;
    emailPai: string;
    motivo: string;
}

export interface FechamentoDia {
    data: string;
    atrasados: LinhaFechamentoDia[];
    saidasAntecipadas: LinhaFechamentoDia[];
    faltasDoDia: LinhaFechamentoDia[];
    faltasHistoricas: FaltaHistoricaEscola[];
    aulasAntecipados: FaltaPorAula[];
    aulasAtrasados: FaltaPorAula[];
    aulasFaltasDia: FaltaPorAula[];
    aulasGeral: FaltaPorAula[];
    turmasSemGrade: string[];
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
    private _dispensaDAO: DispensaDAO;

    /**
     * Índices montados uma vez por consulta. A chave é a própria lista carregada do banco
     * naquela requisição: o índice some junto com ela, sem cache entre consultas. Antes,
     * cada registro varria a grade inteira e todas as movimentações (milhões de operações
     * num bimestre); agora cada busca é um acesso a Map.
     */
    private readonly _indiceMovimentacoes = new WeakMap<Movimentacao[], {
        porAlunoEDia: Map<string, Movimentacao[]>;
        porAluno: Map<string, Movimentacao[]>;
    }>();
    private readonly _indiceGrade = new WeakMap<GradeHorario[], {
        porDia: Map<string, { grade: GradeHorario; turma: string; equivalente: string }[]>;
        aulas: Map<string, GradeHorario[]>;
    }>();

    private indiceDasMovimentacoes(movimentacoes: Movimentacao[]) {
        let indice = this._indiceMovimentacoes.get(movimentacoes);
        if (!indice) {
            indice = { porAlunoEDia: new Map(), porAluno: new Map() };
            for (const movimentacao of movimentacoes) {
                const chave = `${movimentacao.matricula}|${this.chaveData(movimentacao.data)}`;
                const doDia = indice.porAlunoEDia.get(chave);
                if (doDia) doDia.push(movimentacao); else indice.porAlunoEDia.set(chave, [movimentacao]);
                const doAluno = indice.porAluno.get(movimentacao.matricula);
                if (doAluno) doAluno.push(movimentacao); else indice.porAluno.set(movimentacao.matricula, [movimentacao]);
            }
            // Mesma ordem de antes: sort estável por horário sobre a ordem carregada.
            indice.porAlunoEDia.forEach(lista => lista.sort((a, b) => a.horario.localeCompare(b.horario)));
            this._indiceMovimentacoes.set(movimentacoes, indice);
        }
        return indice;
    }

    constructor(
        alunoDAODependency: AlunoDAO,
        registroDAODependency: RegistroDAO,
        movimentacaoDAODependency: MovimentacaoDAO,
        gradeHorarioDAODependency: GradeHorarioDAO,
        configuracaoAlertaFaltaDAODependency: ConfiguracaoAlertaFaltaDAO,
        alertaFaltaDAODependency: AlertaFaltaDAO,
        dispensaDAODependency: DispensaDAO,
        private readonly abonoDAO: AbonoDAO
    ) {
        this._alunoDAO = alunoDAODependency;
        this._registroDAO = registroDAODependency;
        this._movimentacaoDAO = movimentacaoDAODependency;
        this._gradeHorarioDAO = gradeHorarioDAODependency;
        this._configuracaoAlertaFaltaDAO = configuracaoAlertaFaltaDAODependency;
        this._alertaFaltaDAO = alertaFaltaDAODependency;
        this._dispensaDAO = dispensaDAODependency;
    }

    /** Indica, pela data do calendário, se o aluno tem dispensa vigente na disciplina. */
    private criarConsultaDeDispensas(dispensas: Dispensa[]): (idAluno: string | undefined, cod: string, dia: Date) => boolean {
        const porAluno = new Map<string, Dispensa[]>();
        dispensas.forEach(dispensa => {
            const lista = porAluno.get(dispensa.idAluno) || [];
            lista.push(dispensa);
            porAluno.set(dispensa.idAluno, lista);
        });
        return (idAluno, cod, dia) => {
            if (!idAluno) return false;
            const chaveDia = this.chaveData(dia);
            return (porAluno.get(idAluno) || []).some(dispensa =>
                dispensa.cod === cod &&
                this.chaveData(dispensa.dia) <= chaveDia &&
                this.chaveData(dispensa.dataFim) >= chaveDia
            );
        };
    }

    private mesmaData(primeira: Date, segunda: Date): boolean {
        return this.chaveData(primeira) === this.chaveData(segunda);
    }

    private chaveData(data: Date): string {
        return data.toISOString().slice(0, 10);
    }

    /** Movimentações do aluno no dia do registro, por horário. A lista devolvida é só para leitura. */
    private movimentacoesDoAlunoNoDia(registro: Registro, movimentacoes: Movimentacao[]): Movimentacao[] {
        return this.indiceDasMovimentacoes(movimentacoes).porAlunoEDia
            .get(`${registro.matricula}|${this.chaveData(registro.dia)}`) ?? [];
    }

    /**
     * Retorna a situação da aula no seu horário de início. A chamada fornece a
     * situação inicial do dia; cada entrada ou saída registrada até o começo
     * daquela aula atualiza essa situação. Logo, quem entra às 08:40 falta às
     * 07:50 e está presente na aula iniciada às 08:40.
     */
    private faltaNoHorario(registro: Registro, movimentacoes: Movimentacao[], horarioInicio: string): boolean {
        const doAlunoNoDia = this.movimentacoesDoAlunoNoDia(registro, movimentacoes);
        let falta = doAlunoNoDia[0]?.tipo === "entrada" || registro.falta;
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
        const movimento = (this.indiceDasMovimentacoes(movimentacoes).porAluno.get(matricula) ?? [])
            .filter(item =>
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
    /** A lista devolvida é compartilhada dentro da consulta: só para leitura. */
    private aulasDaTurmaNoDia(turma: string, dia: string, grades: GradeHorario[]): GradeHorario[] {
        let indice = this._indiceGrade.get(grades);
        if (!indice) {
            // Normaliza dia e turma de cada aula uma vez, mantendo a ordem da grade.
            const porDia = new Map<string, { grade: GradeHorario; turma: string; equivalente: string }[]>();
            for (const grade of grades) {
                const diaDaAula = this.normalizarDiaSemana(grade.dia);
                const item = { grade, turma: this.normalizarTurma(grade.turma), equivalente: this.normalizarTurmaEquivalente(grade.turma) };
                const lista = porDia.get(diaDaAula);
                if (lista) lista.push(item); else porDia.set(diaDaAula, [item]);
            }
            indice = { porDia, aulas: new Map() };
            this._indiceGrade.set(grades, indice);
        }
        const chave = `${turma}\u0000${dia}`;
        const guardadas = indice.aulas.get(chave);
        if (guardadas) return guardadas;

        const doMesmoDia = indice.porDia.get(dia) ?? [];
        const normalizada = this.normalizarTurma(turma);
        let aulas = doMesmoDia.filter(item => item.turma === normalizada).map(item => item.grade);
        if (aulas.length === 0) {
            const equivalente = this.normalizarTurmaEquivalente(turma);
            aulas = doMesmoDia.filter(item => item.equivalente === equivalente).map(item => item.grade);
        }
        indice.aulas.set(chave, aulas);
        return aulas;
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

    /** Uma chamada salva prova o vínculo do aluno naquele dia, mesmo em cadastros importados depois. */
    private async incluirAlunosComRegistros(alunos: Awaited<ReturnType<AlunoDAO["findAll"]>>, registros: Registro[]): Promise<void> {
        const faltantes = new Set(registros.map(r => r.matricula).filter(m => !alunos.some(a => a.matricula === m)));
        if (!faltantes.size) return;
        const [ativos, arquivados] = await Promise.all([this._alunoDAO.findAll(), this._alunoDAO.findAllDeleted()]);
        for (const aluno of [...ativos, ...arquivados]) {
            if (faltantes.delete(aluno.matricula)) alunos.push(aluno);
        }
    }

    //frequência de uma turma num dia: busca os alunos da turma, depois os registros do dia, e interpola via software
    public frequenciaPorTurma = async (turma: string, dia: Date): Promise<FrequenciaAluno[]> => {
        log.debug("frequenciaPorTurma()", { turma, dia });

        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dia, dia);
        const [todosRegistros, movimentacoes, grades] = await Promise.all([
            this._registroDAO.findDoDia(dia, turma),
            this._movimentacaoDAO.findNoPeriodo(dia, dia),
            this._gradeHorarioDAO.findAll()
        ]);

        await this.incluirAlunosComRegistros(alunosDaTurma, todosRegistros.filter(registro => registro.turma === turma && this.mesmaData(registro.dia, dia)));
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
                movimentacao: this.ultimaMovimentacao(aluno.matricula, movimentacoes, dia, dia)
            };
        });
    };

    //faltas de uma turma num período (usado por semana/mês/período customizado)
    public faltasPorTurmaEPeriodo = async (turma: string, dataInicio: Date, dataFim: Date): Promise<FaltasPorAluno[]> => {
        log.debug("faltasPorTurmaEPeriodo()", { turma, dataInicio, dataFim });

        const alunosDaTurma = await this._alunoDAO.findByTurmaNoPeriodo(turma, dataInicio, dataFim);
        const [todosRegistros, movimentacoes, grades] = await Promise.all([
            this._registroDAO.findNoPeriodo(dataInicio, dataFim, turma),
            this._movimentacaoDAO.findNoPeriodo(dataInicio, dataFim),
            this._gradeHorarioDAO.findAll()
        ]);

        // Faltas abonadas ou dispensadas não contam no total, como nos alertas e no fechamento.
        const registrosNoPeriodo = todosRegistros.filter((registro: Registro) =>
            registro.turma === turma &&
            registro.dia >= dataInicio && registro.dia <= dataFim &&
            !["Abonada", "Dispensada"].includes(registro.situacao) &&
            this.possuiFaltaNaGradeDoDia(registro, movimentacoes, grades)
        );

        await this.incluirAlunosComRegistros(alunosDaTurma, registrosNoPeriodo);
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
        dataFim.setUTCDate(dataFim.getUTCDate() + 6);
        dataFim.setUTCHours(23, 59, 59, 999);
        return await this.faltasPorTurmaEPeriodo(turma, data, dataFim);
    };

    //faltas por turma/mês: considera o mês inteiro da data informada
    public faltasPorTurmaMes = async (turma: string, ano: number, mes: number): Promise<FaltasPorAluno[]> => {
        log.debug("faltasPorTurmaMes()", { turma, ano, mes });
        // Os dias da chamada são gravados à meia-noite UTC: o mês também é recortado em UTC.
        const dataInicio = new Date(Date.UTC(ano, mes - 1, 1));
        const dataFim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
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

        const [alunos, alunosArquivados, faltasValidas, registrosDoDia, movimentacoesDoDia, grades, dispensas, abonos] = await Promise.all([
            this._alunoDAO.findAll(),
            this._alunoDAO.findAllDeleted(),
            this._registroDAO.findFaltasParaFechamento(),
            this._registroDAO.findDoDia(data),
            this._movimentacaoDAO.findAll(data),
            this._gradeHorarioDAO.findAll(),
            this._dispensaDAO.findAll(),
            this.abonoDAO.findAll()
        ]);
        const estaDispensado = this.criarConsultaDeDispensas(dispensas);
        // Registros históricos podem pertencer a alunos arquivados após uma
        // importação. Mantemos seus contatos para montar os CSVs completos.
        const alunosPorMatricula = new Map([
            ...alunosArquivados.map(aluno => [aluno.matricula, aluno] as const),
            ...alunos.map(aluno => [aluno.matricula, aluno] as const)
        ]);
        const dataFormatada = this.chaveData(data);
        const abonosDoDia = abonos.filter(abono => abono.status === 'Aprovado' && this.chaveData(abono.dataInicio) <= dataFormatada && this.chaveData(abono.dataFim) >= dataFormatada);
        const abonoPorMatricula = new Map(abonosDoDia.map(abono => [abono.matricula, abono]));
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
        abonosDoDia.forEach(abono => {
            if (!faltasDoDiaPorMatricula.has(abono.matricula)) faltasDoDiaPorMatricula.set(abono.matricula, {
                ...dadosDoAluno(abono.matricula, abono.alunoNome, abono.turma), data: dataFormatada
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

        // Uma linha por aula efetivamente perdida, mesmo em aulas consecutivas
        // da mesma disciplina. O conjunto geral elimina apenas aulas repetidas.
        const matriculas = new Set([
            ...registrosDoDia.filter(r => r.falta).map(r => r.matricula),
            ...movimentacoesDoDia.map(m => m.matricula),
            ...abonosDoDia.map(a => a.matricula)
        ]);
        const aulasAntecipados: FaltaPorAula[] = [];
        const aulasAtrasados: FaltaPorAula[] = [];
        const aulasFaltasDia: FaltaPorAula[] = [];
        const turmasSemGrade = new Set<string>();
        const todasAulasAusentes: FaltaPorAula[] = [];
        matriculas.forEach(matricula => {
            const registrosAluno = registrosDoDia.filter(r => r.matricula === matricula).sort((a, b) => {
                const momento = (r: Registro) => (r.auditoria.alteradoEm || r.auditoria.criadoEm).getTime();
                return momento(b) - momento(a) || b.idRegistro.localeCompare(a.idRegistro);
            });
            const registroGeral = registrosAluno.find(r => r.codDisciplina.trim().toUpperCase() === 'GERAL');
            const registro = registroGeral || registrosAluno[0];
            const abono = abonoPorMatricula.get(matricula);
            if (!abono && registroGeral?.situacao === 'Dispensada') return;
            const movimentos = movimentacoesDoDia.filter(m => m.matricula === matricula)
                .sort((a, b) => a.horario.localeCompare(b.horario));
            const aluno = alunosPorMatricula.get(matricula);
            const turma = abono?.turma || registro?.turma || aluno?.turma || '';
            const aulas = this.aulasDaTurmaNoDia(turma, this.diaSemanaDaData(data), grades);
            if (!aulas.length) { turmasSemGrade.add(turma || '(turma não encontrada)'); return; }
            const resultado = aulas.map(aula => {
                // Na ausência de chamada, uma entrada implica ausência inicial;
                // uma saída implica presença inicial, como no controle diário.
                const registroDaAula = registroGeral || registrosAluno.find(r => r.codDisciplina === aula.cod);
                if (!abono && registroDaAula?.situacao === 'Dispensada') {
                    return { aula, ausente: false, causa: '' };
                }
                if (!abono && aluno && estaDispensado(aluno.idAluno, aula.cod, data)) {
                    return { aula, ausente: false, causa: '' };
                }
                let ausente = movimentos[0]?.tipo === 'entrada' || Boolean(registroDaAula?.falta);
                let causa: string = ausente ? 'chamada' : ''; 
                movimentos.filter(m => m.horario <= aula.horaInicio).forEach(m => {
                    ausente = m.tipo === 'saida';
                    causa = ausente ? 'saida' : '';
                });
                if (ausente && causa === 'chamada' && movimentos.some(m => m.tipo === 'entrada' && m.horario > aula.horaInicio)) causa = 'entrada';
                return { aula, ausente: Boolean(abono) || ausente, causa };
            });
            const faltouDiaTodo = resultado.every(item => item.ausente);
            resultado.filter(item => item.ausente).forEach(({ aula, causa }) => {
                const linha: FaltaPorAula = {
                    ano: Number(dataFormatada.slice(0, 4)), codDisciplina: aula.cod,
                    data: dataFormatada, horarioInicio: aula.horaInicio, matricula,
                    emailPai: aluno?.paiEmail || '',
                    motivo: (causa === 'entrada'
                        ? movimentos.find(m => m.tipo === 'entrada' && m.horario > aula.horaInicio)
                        : causa === 'saida' ? [...movimentos].reverse().find(m => m.tipo === 'saida' && m.horario <= aula.horaInicio) : undefined)?.motivo || ''
                };
                todasAulasAusentes.push(linha);
                if (causa === 'entrada') aulasAtrasados.push(linha);
                if (causa === 'saida') aulasAntecipados.push(linha);
                if (faltouDiaTodo) aulasFaltasDia.push(linha);
            });
        });
        const ordenar = (a: FaltaPorAula, b: FaltaPorAula) => a.matricula.localeCompare(b.matricula) || a.horarioInicio.localeCompare(b.horarioInicio) || a.codDisciplina.localeCompare(b.codDisciplina);
        const deduplicar = (linhas: FaltaPorAula[]) => {
            const unicas = new Map<string, FaltaPorAula>();
            linhas.forEach(linha => unicas.set(JSON.stringify([linha.matricula, linha.data, linha.horarioInicio, linha.codDisciplina]), linha));
            return [...unicas.values()].sort(ordenar);
        };
        aulasAntecipados.splice(0, aulasAntecipados.length, ...deduplicar(aulasAntecipados));
        aulasAtrasados.splice(0, aulasAtrasados.length, ...deduplicar(aulasAtrasados));
        aulasFaltasDia.splice(0, aulasFaltasDia.length, ...deduplicar(aulasFaltasDia));
        const unicas = new Map<string, FaltaPorAula>();
        todasAulasAusentes.forEach(linha => {
            unicas.set(JSON.stringify([linha.matricula, linha.data, linha.horarioInicio, linha.codDisciplina]), linha);
        });
        const aulasGeral = [...unicas.values()].sort(ordenar);
        return { data: dataFormatada, atrasados, saidasAntecipadas, faltasDoDia, faltasHistoricas,
            aulasAntecipados, aulasAtrasados, aulasFaltasDia, aulasGeral, turmasSemGrade: [...turmasSemGrade] };
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
        // Os dias da chamada são gravados à meia-noite UTC: o período também é recortado em UTC,
        // para o fuso do servidor não puxar o dia 1º do bimestre seguinte nem perder o primeiro.
        const dataInicio = new Date(Date.UTC(ano, periodo.inicio, 1));
        const dataFim = new Date(Date.UTC(ano, periodo.fim + 1, 0, 23, 59, 59, 999));
        const [grades, configuracoes, movimentacoes, alunosAtivos, dispensas] = await Promise.all([
            this._gradeHorarioDAO.findAll(),
            this._configuracaoAlertaFaltaDAO.findAll(),
            this._movimentacaoDAO.findNoPeriodo(dataInicio, dataFim),
            this._alunoDAO.findAll(),
            this._dispensaDAO.findAll()
        ]);
        // Uma presença só vira falta se houver saída antecipada no dia (a entrada só tira a
        // falta). Logo, basta ler as faltas e os registros de quem teve saída no período: os
        // demais registros de presença nunca geram alerta. O cálculo abaixo é o mesmo.
        const matriculasComSaida = [...new Set(movimentacoes.filter(m => m.tipo === "saida").map(m => m.matricula))];
        const todosRegistros = await this._registroDAO.findFaltasOuDasMatriculasNoPeriodo(dataInicio, dataFim, matriculasComSaida);
        // Alunos arquivados pela importação da lista oficial não geram alertas.
        const alunosPorMatricula = new Map(alunosAtivos.map(aluno => [aluno.matricula, aluno]));
        const estaDispensado = this.criarConsultaDeDispensas(dispensas);
        const registros = todosRegistros.filter(registro =>
            registro.dia >= dataInicio && registro.dia <= dataFim &&
            alunosPorMatricula.has(registro.matricula) &&
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
            // Uma dispensa vigente da disciplina tira a aula da contagem.
            if (estaDispensado(alunosPorMatricula.get(registro.matricula)?.idAluno, grade.cod, registro.dia)) return;
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