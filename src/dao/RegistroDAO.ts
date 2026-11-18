import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Registro } from "../models/Registro";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("RegistroDAO");

export class RegistroDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase){
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("registro");
    }

    public async create(registro: Registro, funcionarioLogado: Funcionario): Promise<Registro> {
        log.debug("create()", {
            matricula: registro.matricula,
            codDisciplina: registro.codDisciplina,
            dia: registro.dia,
        });
        const collection = await this.getCollection();

        //quem criou
        registro.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            ano: registro.ano,
            codDisciplina: registro.codDisciplina,
            horaInicio: registro.horaInicio,
            horaFim: registro.horaFim,
            matricula: registro.matricula,
            alunoNome: registro.alunoNome,
            turma: registro.turma,
            curso: registro.curso,
            serie: registro.serie,
            falta: registro.falta,
            dia: registro.dia,
            atrasado: registro.atrasado,
            nomeAcompanhante: registro.nomeAcompanhante,
            situacao: registro.situacao,
            auditoria: registro.auditoria.toJSON()
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            log.error("falha ao inserir registro", { matricula: registro.matricula });
            throw new Error("Falha ao inserir registro");
        }

        registro.idRegistro = result.insertedId.toString();
        log.info("registro inserido", {
            idRegistro: registro.idRegistro,
            matricula: registro.matricula,
            falta: registro.falta,
        });
        return registro;
    }

    public async delete (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean>{
        log.debug("delete()", { idRegistro: registro.idRegistro });
        const collection = await this.getCollection();
        registro.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = {
            _id: new ObjectId(registro.idRegistro),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": registro.auditoria.deletadoPor,
                "auditoria.deletadoEm": registro.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("registro removido", { idRegistro: registro.idRegistro });
        else log.warn("registro não encontrado para remoção", { idRegistro: registro.idRegistro });
        return ok;
    }

    public async update (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean>{
        log.debug("update()", { idRegistro: registro.idRegistro });
        const collection = await this.getCollection();
        registro.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        // A situação (Abonada/Dispensada) é mantida pelos fluxos de abono e dispensa;
        // corrigir a chamada não pode apagá-la.
        const filter: Filter<Document> = { _id: new ObjectId(registro.idRegistro), "auditoria.deletadoEm": null };
        const update: UpdateFilter<Document> = {
            $set: {
                falta: registro.falta,
                atrasado: registro.atrasado,
                nomeAcompanhante: registro.nomeAcompanhante,
                "auditoria.alteradoPor": registro.auditoria.alteradoPor,
                "auditoria.alteradoEm": registro.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("registro atualizado", { idRegistro: registro.idRegistro });
        else log.warn("registro não encontrado para atualização", { idRegistro: registro.idRegistro });
        return ok;
    }

    public async updateSituacaoPorMatriculaEPeriodo(matricula: string, dataInicio: Date, dataFim: Date, situacao: string, funcionarioLogado: Funcionario, somenteSituacao?: string): Promise<number> {
        log.debug("updateSituacaoPorMatriculaEPeriodo()", {
            matricula,
            dataInicio,
            dataFim,
            situacao,
        });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            matricula,
            dia: { $gte: dataInicio, $lte: dataFim },
            falta: true,
            "auditoria.deletadoEm": null,
            ...(somenteSituacao ? { situacao: somenteSituacao } : {})
        };
        const update: UpdateFilter<Document> = {
            $set: {
                situacao,
                "auditoria.alteradoPor": funcionarioLogado.idFuncionario,
                "auditoria.alteradoEm": new Date()
            }
        };
        const result = await collection.updateMany(filter, update);
        log.info("situação atualizada em lote", {
            matricula,
            situacao,
            total: result.modifiedCount,
        });
        return result.modifiedCount;
    }

    private toRegistro(doc: any): Registro {
        const registro = new Registro();
        registro.idRegistro = doc._id.toHexString();
        registro.ano = doc.ano;
        registro.codDisciplina = doc.codDisciplina;
        registro.horaInicio = doc.horaInicio;
        registro.horaFim = doc.horaFim;
        registro.matricula = doc.matricula;
        registro.alunoNome = doc.alunoNome || '';
        registro.turma = doc.turma || '';
        registro.curso = doc.curso || '';
        registro.serie = doc.serie || '';
        registro.falta = doc.falta;
        registro.dia = new Date(doc.dia);
        registro.atrasado = doc.atrasado;
        registro.nomeAcompanhante = doc.nomeAcompanhante || '';
        registro.situacao = doc.situacao || 'Normal';
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            registro.auditoria = auditoria;
        }
        return registro;
    }

    public async findById(idRegistro: string): Promise<Registro | null> {
        log.debug("findById()", { idRegistro });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idRegistro),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toRegistro(doc) : null;
    }

    public async findAll(): Promise<Registro[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null })
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    /** Faltas válidas no período, sem registros abonados, dispensados ou excluídos. */
    public async findFaltasNoPeriodo(dataInicio: Date, dataFim: Date): Promise<Registro[]> {
        log.debug("findFaltasNoPeriodo()", { dataInicio, dataFim });
        const collection = await this.getCollection();
        const cursor = collection.find({
            dia: { $gte: dataInicio, $lte: dataFim },
            falta: true,
            situacao: { $nin: ["Abonada", "Dispensada"] },
            "auditoria.deletadoEm": null
        });
        return (await cursor.toArray()).map(doc => this.toRegistro(doc));
    }

    public async findAllDeleted(): Promise<Registro[]> {
        log.debug("findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    public async findByField(field: string, value: any): Promise<Registro[]> {
        log.debug("findByField()", { field, value });
        const allowedFields = ["_id", "matricula", "codDisciplina"];
        if (!allowedFields.includes(field)) {
            log.warn("campo inválido para busca", { field });
            throw new Error(`Campo inválido para busca: ${field}`);
        }
        const collection = await this.getCollection();
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = {
                _id: new ObjectId(value),
                "auditoria.deletadoEm": null
            };
        } else {
            filter = {
                [field]: value,
                "auditoria.deletadoEm": null
            };
        }
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    public async findAusentesEntrada(matriculas: string[], dia: Date): Promise<Registro[]> {
        log.debug("findAusentesEntrada()", { totalMatriculas: matriculas.length, dia });
        const collection = await this.getCollection();

        const { inicioDia, fimDia } = RegistroDAO.limitesDoDiaUtc(dia);

        const filter: Filter<Document> = {
            matricula: { $in: matriculas },
            dia: { $gte: inicioDia, $lte: fimDia },
            falta: true,
            "auditoria.deletadoEm": null
        };

        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    /** Retorna a chamada geral já gravada para uma turma em uma data. */
    public async findChamadaPorTurmaEDia(turma: string, dia: Date): Promise<Registro[]> {
        log.debug("findChamadaPorTurmaEDia()", { turma, dia });
        const collection = await this.getCollection();
        const { inicioDia, fimDia } = RegistroDAO.limitesDoDiaUtc(dia);
        const docs = await collection.find({
            turma,
            codDisciplina: "GERAL",
            dia: { $gte: inicioDia, $lte: fimDia },
            "auditoria.deletadoEm": null
        }).toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    /**
     * Registros ativos de um intervalo (inclusive), opcionalmente de uma turma. Os relatórios
     * usam isto em vez de carregar a coleção inteira: o filtro é o mesmo que eles aplicavam
     * em memória, agora feito pelo banco com índice.
     */
    public async findNoPeriodo(dataInicio: Date, dataFim: Date, turma?: string): Promise<Registro[]> {
        log.debug("findNoPeriodo()", { dataInicio, dataFim, turma });
        const collection = await this.getCollection();
        const filtro: Filter<Document> = { "auditoria.deletadoEm": null, dia: { $gte: dataInicio, $lte: dataFim } };
        if (turma !== undefined) filtro.turma = turma;
        const docs = await collection.find(filtro).toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    /**
     * Registros do período que podem virar falta: as faltas e os registros das matrículas
     * informadas (quem teve saída antecipada, que transforma presença em ausência).
     */
    public async findFaltasOuDasMatriculasNoPeriodo(dataInicio: Date, dataFim: Date, matriculas: string[]): Promise<Registro[]> {
        log.debug("findFaltasOuDasMatriculasNoPeriodo()", { dataInicio, dataFim, matriculas: matriculas.length });
        const collection = await this.getCollection();
        const docs = await collection.find({
            "auditoria.deletadoEm": null,
            dia: { $gte: dataInicio, $lte: dataFim },
            $or: [{ falta: true }, { matricula: { $in: matriculas } }]
        }).toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    /** Registros ativos do dia do calendário (UTC), opcionalmente de uma turma. */
    public async findDoDia(dia: Date, turma?: string): Promise<Registro[]> {
        const { inicioDia, fimDia } = RegistroDAO.limitesDoDiaUtc(dia);
        return this.findNoPeriodo(inicioDia, fimDia, turma);
    }

    /** Faltas que contam (nem abonadas nem dispensadas), de todo o histórico. */
    public async findFaltasQueContam(): Promise<Registro[]> {
        log.debug("findFaltasQueContam()");
        const collection = await this.getCollection();
        const docs = await collection.find({
            "auditoria.deletadoEm": null,
            falta: true,
            situacao: { $nin: ["Abonada", "Dispensada"] }
        }).toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    /** Registro geral (chamada do dia) já gravado para o aluno, se houver. */
    public async findGeralDoAlunoNoDia(matricula: string, dia: Date): Promise<Registro | null> {
        log.debug("findGeralDoAlunoNoDia()", { matricula, dia });
        const collection = await this.getCollection();
        const { inicioDia, fimDia } = RegistroDAO.limitesDoDiaUtc(dia);
        const doc = await collection.findOne({
            matricula,
            codDisciplina: "GERAL",
            dia: { $gte: inicioDia, $lte: fimDia },
            "auditoria.deletadoEm": null
        });
        return doc ? this.toRegistro(doc) : null;
    }

    /** Os dias são gravados à meia-noite UTC; a consulta usa o mesmo dia do calendário em UTC. */
    private static limitesDoDiaUtc(dia: Date): { inicioDia: Date; fimDia: Date } {
        const ano = dia.getUTCFullYear(), mes = dia.getUTCMonth(), data = dia.getUTCDate();
        return {
            inicioDia: new Date(Date.UTC(ano, mes, data, 0, 0, 0, 0)),
            fimDia: new Date(Date.UTC(ano, mes, data, 23, 59, 59, 999))
        };
    }
}
