"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbonoDAO = void 0;
const mongodb_1 = require("mongodb");
const Abono_1 = require("../models/Abono");
const Auditoria_1 = require("@/models/Auditoria");
class AbonoDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ AbonoDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("abonos");
    }
    async create(abono, funcionarioLogado) {
        console.log("🟢 AbonoDAO.create()");
        const collection = await this.getCollection();
        abono.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const doc = {
            matricula: abono.matricula,
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
    async delete(abono, funcionarioLogado) {
        console.log("🟢 AbonoDAO.delete(" + abono.idAbono + ")");
        const collection = await this.getCollection();
        abono.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(abono.idAbono) };
        const update = {
            $set: {
                "auditoria.deletadoPor": abono.auditoria.deletadoPor,
                "auditoria.deletadoEm": abono.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async update(abono, funcionarioLogado) {
        console.log("🟢 AbonoDAO.update(" + abono.idAbono + ")");
        const collection = await this.getCollection();
        abono.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(abono.idAbono) };
        const update = {
            $set: {
                matricula: abono.matricula,
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
    toAbono(doc) {
        const abono = new Abono_1.Abono();
        abono.idAbono = doc._id.toHexString();
        abono.matricula = doc.matricula;
        abono.dataInicio = new Date(doc.dataInicio);
        abono.dataFim = new Date(doc.dataFim);
        abono.motivo = doc.motivo;
        abono.nomeArquivo = doc.nomeArquivo || '';
        abono.status = doc.status || 'Pendente';
        abono.aprovadoPor = doc.aprovadoPor || '';
        if (doc.auditoria) {
            const auditoria = new Auditoria_1.Auditoria();
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
    async findById(idAbono) {
        console.log("🟢 AbonoDAO.findById()");
        const collection = await this.getCollection();
        const filter = {
            _id: new mongodb_1.ObjectId(idAbono),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toAbono(doc) : null;
    }
    async findAll() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAbono(doc));
    }
    async findAllDeleted() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAbono(doc));
    }
    async count() {
        console.log("🟢 AbonoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }
    async findByField(field, value) {
        console.log(`🟢 AbonoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "matricula", "status"];
        if (!allowedFields.includes(field)) {
            throw new Error(`Campo inválido para busca: ${field}`);
        }
        const collection = await this.getCollection();
        let filter = {};
        if (field === "_id") {
            filter = {
                _id: new mongodb_1.ObjectId(value),
                "auditoria.deletadoEm": null
            };
        }
        else {
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
exports.AbonoDAO = AbonoDAO;
//# sourceMappingURL=AbonoDAO.js.map