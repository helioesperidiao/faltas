import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Dispensa } from "../models/Dispensa";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("DispensaDAO");

export class DispensaDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase){
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("dispensa");
    }

    public async create(dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<Dispensa> {
        log.debug("create()", { idAluno: dispensa.idAluno, turma: dispensa.turma });
        const collection = await this.getCollection();

        //quem criou
        dispensa.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            idAluno: dispensa.idAluno,
            turma: dispensa.turma,
            horaInicio: dispensa.horaInicio,
            horaFim: dispensa.horaFim,
            dia: dispensa.dia,
            dataFim: dispensa.dataFim,
            cod: dispensa.cod,
            disciplina: dispensa.disciplina,
            motivo: dispensa.motivo,
            nomeArquivo: dispensa.nomeArquivo,
            auditoria: dispensa.auditoria.toJSON()
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            log.error("falha ao inserir dispensa", { idAluno: dispensa.idAluno });
            throw new Error("Falha ao inserir dispensa");
        }

        dispensa.idDispensa = result.insertedId.toString();
        log.info("dispensa inserida", {
            idDispensa: dispensa.idDispensa,
            idAluno: dispensa.idAluno,
            turma: dispensa.turma,
        });
        return dispensa;
    }

    public async delete (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean>{
        log.debug("delete()", { idDispensa: dispensa.idDispensa });
        const collection = await this.getCollection();
        dispensa.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = {
            _id: new ObjectId(dispensa.idDispensa),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": dispensa.auditoria.deletadoPor,
                "auditoria.deletadoEm": dispensa.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("dispensa removida", { idDispensa: dispensa.idDispensa });
        else log.warn("dispensa não encontrada para remoção", { idDispensa: dispensa.idDispensa });
        return ok;
    }

    public async update (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean>{
        log.debug("update()", { idDispensa: dispensa.idDispensa });
        const collection = await this.getCollection();
        dispensa.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = { _id: new ObjectId(dispensa.idDispensa) };
        const update: UpdateFilter<Document> = {
            $set: {
                turma: dispensa.turma,
                horaInicio: dispensa.horaInicio,
                horaFim: dispensa.horaFim,
                dia: dispensa.dia,
                dataFim: dispensa.dataFim,
                cod: dispensa.cod,
                disciplina: dispensa.disciplina,
                motivo: dispensa.motivo,
                nomeArquivo: dispensa.nomeArquivo,
                "auditoria.alteradoPor": dispensa.auditoria.alteradoPor,
                "auditoria.alteradoEm": dispensa.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("dispensa atualizada", { idDispensa: dispensa.idDispensa });
        else log.warn("dispensa não encontrada para atualização", { idDispensa: dispensa.idDispensa });
        return ok;
    }

    private toDispensa(doc: any): Dispensa {
        const dispensa = new Dispensa();
        dispensa.idDispensa = doc._id.toHexString();
        dispensa.idAluno = doc.idAluno;
        dispensa.turma = doc.turma;
        dispensa.horaInicio = doc.horaInicio;
        dispensa.horaFim = doc.horaFim;
        dispensa.dia = new Date(doc.dia);
        dispensa.dataFim = doc.dataFim ? new Date(doc.dataFim) : new Date(doc.dia);
        dispensa.cod = doc.cod;
        dispensa.disciplina = doc.disciplina;
        dispensa.motivo = doc.motivo;
        dispensa.nomeArquivo = doc.nomeArquivo || '';
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            dispensa.auditoria = auditoria;
        }
        return dispensa;
    }

    public async findById(idDispensa: string): Promise<Dispensa | null> {
        log.debug("findById()", { idDispensa });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idDispensa),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toDispensa(doc) : null;
    }

    public async findAll(): Promise<Dispensa[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null })
        const docs = await cursor.toArray();
        return docs.map(doc => this.toDispensa(doc));
    }

    public async findAllDeleted(): Promise<Dispensa[]> {
        log.debug("findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toDispensa(doc));
    }

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    public async findByField(field: string, value: any): Promise<Dispensa[]> {
        log.debug("findByField()", { field, value });
        const allowedFields = ["_id", "idAluno", "disciplina", "cod"];
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
        return docs.map(doc => this.toDispensa(doc));
    }

    public async findVigenteParaAluno(idAluno: string, cod: string, data: Date): Promise<Dispensa | null> {
        log.debug("findVigenteParaAluno()", { idAluno, cod, data });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            idAluno,
            cod,
            dia: { $lte: data },
            dataFim: { $gte: data },
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toDispensa(doc) : null;
    }
}