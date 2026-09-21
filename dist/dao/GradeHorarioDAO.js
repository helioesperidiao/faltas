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
            duracaoAulaMinutos: GradeHorario_1.GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim),
            cargaHorariaSemanalMinutos: GradeHorario_1.GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim),
            auditoria: grade.auditoria.toJSON()
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir grade de horário");
        }
        grade.idGradeHorario = result.insertedId.toString();
        const carga = await this.recalcularCargaHorariaSemanal(grade.turma, grade.cod);
        grade.duracaoAulaMinutos = GradeHorario_1.GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim);
        grade.cargaHorariaSemanalMinutos = carga;
        return grade;
    }
    async delete(grade, funcionarioLogado) {
        console.log("🟢 GradeHorarioDAO.delete(" + grade.idGradeHorario + ")");
        const collection = await this.getCollection();
        grade.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const gradeExistente = await collection.findOne({ _id: new mongodb_1.ObjectId(grade.idGradeHorario) });
        const filter = {
            _id: new mongodb_1.ObjectId(grade.idGradeHorario),
            "auditoria.deletadoEm": null
        };
        const update = {
            $set: {
                "auditoria.deletadoPor": grade.auditoria.deletadoPor,
                "auditoria.deletadoEm": grade.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        if (result.modifiedCount > 0 && gradeExistente) {
            await this.recalcularCargaHorariaSemanal(gradeExistente.turma, gradeExistente.cod);
        }
        return result.modifiedCount > 0;
    }
    async update(grade, funcionarioLogado) {
        console.log("🟢 GradeHorarioDAO.update(" + grade.idGradeHorario + ")");
        const collection = await this.getCollection();
        grade.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const gradeExistente = await collection.findOne({ _id: new mongodb_1.ObjectId(grade.idGradeHorario) });
        const duracaoAulaMinutos = GradeHorario_1.GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim);
        const filter = { _id: new mongodb_1.ObjectId(grade.idGradeHorario) };
        const update = {
            $set: {
                turma: grade.turma,
                horaInicio: grade.horaInicio,
                horaFim: grade.horaFim,
                dia: grade.dia,
                cod: grade.cod,
                disciplina: grade.disciplina,
                duracaoAulaMinutos,
                "auditoria.alteradoPor": grade.auditoria.alteradoPor,
                "auditoria.alteradoEm": grade.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        if (result.modifiedCount > 0) {
            if (gradeExistente) {
                await this.recalcularCargaHorariaSemanal(gradeExistente.turma, gradeExistente.cod);
            }
            const carga = await this.recalcularCargaHorariaSemanal(grade.turma, grade.cod);
            grade.duracaoAulaMinutos = duracaoAulaMinutos;
            grade.cargaHorariaSemanalMinutos = carga;
        }
        return result.modifiedCount > 0;
    }
    toGradeHorario(doc) {
        const grade = new GradeHorario_1.GradeHorario();
        grade.idGradeHorario = doc._id.toHexString();
        grade.turma = doc.turma;
        grade.horaInicio = doc.horaInicio;
        grade.horaFim = doc.horaFim;
        grade.dia = doc.dia;
        grade.cod = doc.cod;
        grade.disciplina = doc.disciplina;
        grade.duracaoAulaMinutos = doc.duracaoAulaMinutos || GradeHorario_1.GradeHorario.calcularDuracaoMinutos(doc.horaInicio, doc.horaFim);
        grade.cargaHorariaSemanalMinutos = doc.cargaHorariaSemanalMinutos || grade.duracaoAulaMinutos;
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
    async recalcularCargaHorariaSemanal(turma, cod) {
        const collection = await this.getCollection();
        const aulas = await collection.find({ turma, cod, "auditoria.deletadoEm": null }).toArray();
        const cargaHorariaSemanalMinutos = aulas.reduce((total, aula) => total + GradeHorario_1.GradeHorario.calcularDuracaoMinutos(aula.horaInicio, aula.horaFim), 0);
        if (aulas.length > 0) {
            await collection.updateMany({ turma, cod, "auditoria.deletadoEm": null }, { $set: { cargaHorariaSemanalMinutos } });
        }
        return cargaHorariaSemanalMinutos;
    }
}
exports.GradeHorarioDAO = GradeHorarioDAO;
//# sourceMappingURL=GradeHorarioDAO.js.map