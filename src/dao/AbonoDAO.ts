import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Abono } from "../models/Abono";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("AbonoDAO");

/**
 * Executa operações de persistência e consulta da coleção de abonos.
 */
export class AbonoDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("abonos");
    }

    public async create(abono: Abono, funcionarioLogado: Funcionario): Promise<Abono> {
        log.debug("create()", { matricula: abono.matricula });
        const collection = await this.getCollection();

        abono.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            matricula: abono.matricula,
            alunoNome: abono.alunoNome,
            turma: abono.turma,
            curso: abono.curso,
            serie: abono.serie,
            dataInicio: abono.dataInicio,
            dataFim: abono.dataFim,
            motivo: abono.motivo,
            nomeArquivo: abono.nomeArquivo,
            status: abono.status,
            aprovadoPor: abono.aprovadoPor,
            auditoria: abono.auditoria.toJSON()
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            log.error("falha ao inserir abono", { matricula: abono.matricula });
            throw new Error("Falha ao inserir abono");
        }

        abono.idAbono = result.insertedId.toString();
        log.info("abono inserido", {
            idAbono: abono.idAbono,
            matricula: abono.matricula,
            status: abono.status,
        });
        return abono;
    }

    public async delete(abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("delete()", { idAbono: abono.idAbono });
        const collection = await this.getCollection();
        abono.marcarDeletadoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = {
            _id: new ObjectId(abono.idAbono),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": abono.auditoria.deletadoPor,
                "auditoria.deletadoEm": abono.auditoria.deletadoEm
            }
        };

        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("abono removido", { idAbono: abono.idAbono });
        else log.warn("abono não encontrado para remoção", { idAbono: abono.idAbono });
        return ok;
    }

    public async update(abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("update()", { idAbono: abono.idAbono });
        const collection = await this.getCollection();
        abono.marcarAlteradoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = { _id: new ObjectId(abono.idAbono) };
        const update: UpdateFilter<Document> = {
            $set: {
                matricula: abono.matricula,
                alunoNome: abono.alunoNome,
                turma: abono.turma,
                curso: abono.curso,
                serie: abono.serie,
                dataInicio: abono.dataInicio,
                dataFim: abono.dataFim,
                motivo: abono.motivo,
                nomeArquivo: abono.nomeArquivo,
                status: abono.status,
                aprovadoPor: abono.aprovadoPor,
                "auditoria.alteradoPor": abono.auditoria.alteradoPor,
                "auditoria.alteradoEm": abono.auditoria.alteradoEm
            }
        };

        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("abono atualizado", { idAbono: abono.idAbono, status: abono.status });
        else log.warn("abono não encontrado para atualização", { idAbono: abono.idAbono });
        return ok;
    }

    private toAbono(doc: any): Abono {
        const abono = new Abono();
        abono.idAbono = doc._id.toHexString();
        abono.matricula = doc.matricula;
        abono.alunoNome = doc.alunoNome || '';
        abono.turma = doc.turma || '';
        abono.curso = doc.curso || '';
        abono.serie = doc.serie || '';
        abono.dataInicio = new Date(doc.dataInicio);
        abono.dataFim = new Date(doc.dataFim);
        abono.motivo = doc.motivo;
        abono.nomeArquivo = doc.nomeArquivo || '';
        abono.status = doc.status || 'Pendente';
        abono.aprovadoPor = doc.aprovadoPor || '';

        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            abono.auditoria = auditoria;
        }

        return abono;
    }

    public async findById(idAbono: string): Promise<Abono | null> {
        log.debug("findById()", { idAbono });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idAbono),
            "auditoria.deletadoEm": null
        };

        const doc = await collection.findOne(filter);
        return doc ? this.toAbono(doc) : null;
    }

    public async findAll(): Promise<Abono[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAbono(doc));
    }

    public async findAllDeleted(): Promise<Abono[]> {
        log.debug("findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAbono(doc));
    }

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    public async findByField(field: string, value: any): Promise<Abono[]> {
        log.debug("findByField()", { field, value });
        const allowedFields = ["_id", "matricula", "status"];
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
        return docs.map(doc => this.toAbono(doc));
    }
}