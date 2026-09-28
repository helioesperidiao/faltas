import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Abono } from "../models/Abono";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";

export class AbonoDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ AbonoDAO.constructor()");
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("abonos");
    }

    public async create(abono: Abono, funcionarioLogado: Funcionario): Promise<Abono> {
        console.log("🟢 AbonoDAO.create()");
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
            throw new Error("Falha ao inserir abono");
        }

        abono.idAbono = result.insertedId.toString();
        return abono;
    }

    public async delete(abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 AbonoDAO.delete(" + abono.idAbono + ")");
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
        return result.modifiedCount > 0;
    }

    public async update(abono: Abono, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 AbonoDAO.update(" + abono.idAbono + ")");
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
        return result.modifiedCount > 0;
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
        console.log("🟢 AbonoDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idAbono),
            "auditoria.deletadoEm": null
        };

        const doc = await collection.findOne(filter);
        return doc ? this.toAbono(doc) : null;
    }

    public async findAll(): Promise<Abono[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAbono(doc));
    }

    public async findAllDeleted(): Promise<Abono[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAbono(doc));
    }

    public async count(): Promise<number> {
        console.log("🟢 AbonoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    public async findByField(field: string, value: any): Promise<Abono[]> {
        console.log(`🟢 AbonoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "matricula", "status"];
        if (!allowedFields.includes(field)) {
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
