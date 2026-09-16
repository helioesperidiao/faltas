"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensaDAO = void 0;
const mongodb_1 = require("mongodb");
const Dispensa_1 = require("../models/Dispensa");
const Auditoria_1 = require("@/models/Auditoria");
class DispensaDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ DispensaDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("dispensa");
    }
    async create(dispensa, funcionarioLogado) {
        console.log("🟢 DispensDAO.create()");
        const collection = await this.getCollection();
        dispensa.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const doc = {
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
            throw new Error("Falha ao inserir dispensa");
        }
        dispensa.idDispensa = result.insertedId.toString();
        return dispensa;
    }
    async delete(dispensa, funcionarioLogado) {
        console.log("🟢 DispensDAO.delete(" + dispensa.idDispensa + ")");
        const collection = await this.getCollection();
        dispensa.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(dispensa.idDispensa) };
        const update = {
            $set: {
                "auditoria.deletadoPor": dispensa.auditoria.deletadoPor,
                "auditoria.deletadoEm": dispensa.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async update(dispensa, funcionarioLogado) {
        console.log("🟢 DispensaDAO.update(" + dispensa.idDispensa + ")");
        const collection = await this.getCollection();
        dispensa.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(dispensa.idDispensa) };
        const update = {
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
        return result.modifiedCount > 0;
    }
    toDispensa(doc) {
        const dispensa = new Dispensa_1.Dispensa();
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
            const auditoria = new Auditoria_1.Auditoria();
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
    async findById(idDispensa) {
        console.log("🟢 DispensaDAO.findById()");
        const collection = await this.getCollection();
        const filter = {
            _id: new mongodb_1.ObjectId(idDispensa),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toDispensa(doc) : null;
    }
    async findAll() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toDispensa(doc));
    }
    async findAllDeleted() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toDispensa(doc));
    }
    async count() {
        console.log("🟢 DispensaDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }
    async findByField(field, value) {
        console.log(`🟢 DispensaDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "idAluno", "disciplina", "cod"];
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
        return docs.map(doc => this.toDispensa(doc));
    }
    async findVigenteParaAluno(idAluno, cod, data) {
        console.log(`🟢 DispensaDAO.findVigenteParaAluno(${idAluno}, ${cod})`);
        const collection = await this.getCollection();
        const filter = {
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
exports.DispensaDAO = DispensaDAO;
//# sourceMappingURL=DispensaDAO.js.map