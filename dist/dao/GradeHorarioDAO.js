"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeHorarioDAO = void 0;
const mongodb_1 = require("mongodb");
const GradeHorario_1 = require("../models/GradeHorario");
const Auditoria_1 = require("@/models/Auditoria");
class GradeHorarioDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ GradeHorarioDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("gradeHorario");
    }
    corrigirAcentos(valor) {
        if (!/[ÃÂ�]/.test(valor))
            return valor;
        try {
            return decodeURIComponent(escape(valor))
                .replace(/Administra�+o/g, "Administração")
                .replace(/Ter�+a-feira/g, "Terça-feira")
                .replace(/Organiza��o/g, "Organização")
                .replace(/M�todos/g, "Métodos");
        }
        catch {
            return valor
                .replace(/Administra�+o/g, "Administração")
                .replace(/Ter�+a-feira/g, "Terça-feira")
                .replace(/Organiza��o/g, "Organização")
                .replace(/M�todos/g, "Métodos");
        }
    }
    async create(grade, funcionarioLogado) {
        console.log("🟢 GradeHorarioDAO.create()");
        const collection = await this.getCollection();
        grade.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const doc = {
            turma: grade.turma,
            horaInicio: grade.horaInicio,
            horaFim: grade.horaFim,
            dia: grade.dia,
            cod: grade.cod,
            disciplina: grade.disciplina,
            auditoria: grade.auditoria.toJSON()
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir grade de horário");
        }
        grade.idGradeHorario = result.insertedId.toString();
        return grade;
    }
    async delete(grade, funcionarioLogado) {
        console.log("🟢 GradeHorarioDAO.delete(" + grade.idGradeHorario + ")");
        const collection = await this.getCollection();
        grade.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(grade.idGradeHorario) };
        const update = {
            $set: {
                "auditoria.deletadoPor": grade.auditoria.deletadoPor,
                "auditoria.deletadoEm": grade.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async update(grade, funcionarioLogado) {
        console.log("🟢 GradeHorarioDAO.update(" + grade.idGradeHorario + ")");
        const collection = await this.getCollection();
        grade.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(grade.idGradeHorario) };
        const update = {
            $set: {
                turma: grade.turma,
                horaInicio: grade.horaInicio,
                horaFim: grade.horaFim,
                dia: grade.dia,
                cod: grade.cod,
                disciplina: grade.disciplina,
                "auditoria.alteradoPor": grade.auditoria.alteradoPor,
                "auditoria.alteradoEm": grade.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    toGradeHorario(doc) {
        const grade = new GradeHorario_1.GradeHorario();
        grade.idGradeHorario = doc._id.toHexString();
        grade.turma = doc.turma;
        grade.horaInicio = doc.horaInicio;
        grade.horaFim = doc.horaFim;
        grade.dia = this.corrigirAcentos(doc.dia);
        grade.cod = this.corrigirAcentos(doc.cod);
        grade.disciplina = this.corrigirAcentos(doc.disciplina);
        if (doc.auditoria) {
            const auditoria = new Auditoria_1.Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            grade.auditoria = auditoria;
        }
        return grade;
    }
    async findById(idGradeHorario) {
        console.log("🟢 GradeHorarioDAO.findById()");
        const collection = await this.getCollection();
        const filter = {
            _id: new mongodb_1.ObjectId(idGradeHorario),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toGradeHorario(doc) : null;
    }
    async findAll() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }
    async findAllDeleted() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }
    async count() {
        console.log("🟢 GradeHorarioDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }
    async findByField(field, value) {
        console.log(`🟢 GradeHorarioDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "turma", "cod", "dia"];
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
        return docs.map(doc => this.toGradeHorario(doc));
    }
}
exports.GradeHorarioDAO = GradeHorarioDAO;
//# sourceMappingURL=GradeHorarioDAO.js.map