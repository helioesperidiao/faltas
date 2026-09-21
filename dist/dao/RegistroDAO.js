"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistroDAO = void 0;
const mongodb_1 = require("mongodb");
const Registro_1 = require("../models/Registro");
const Auditoria_1 = require("@/models/Auditoria");
class RegistroDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ RegistroDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("registro");
    }
    async create(registro, funcionarioLogado) {
        console.log("🟢 RegistroDAO.create()");
        const collection = await this.getCollection();
        registro.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const doc = {
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
            throw new Error("Falha ao inserir registro");
        }
        registro.idRegistro = result.insertedId.toString();
        return registro;
    }
    async delete(registro, funcionarioLogado) {
        console.log("🟢 RegistroDAO.delete(" + registro.idRegistro + ")");
        const collection = await this.getCollection();
        registro.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter = {
            _id: new mongodb_1.ObjectId(registro.idRegistro),
            "auditoria.deletadoEm": null
        };
        const update = {
            $set: {
                "auditoria.deletadoPor": registro.auditoria.deletadoPor,
                "auditoria.deletadoEm": registro.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async update(registro, funcionarioLogado) {
        console.log("🟢 RegistroDAO.update(" + registro.idRegistro + ")");
        const collection = await this.getCollection();
        registro.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(registro.idRegistro) };
        const update = {
            $set: {
                falta: registro.falta,
                atrasado: registro.atrasado,
                nomeAcompanhante: registro.nomeAcompanhante,
                situacao: registro.situacao,
                "auditoria.alteradoPor": registro.auditoria.alteradoPor,
                "auditoria.alteradoEm": registro.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async updateSituacaoPorMatriculaEPeriodo(matricula, dataInicio, dataFim, situacao, funcionarioLogado) {
        console.log(`🟢 RegistroDAO.updateSituacaoPorMatriculaEPeriodo(${matricula}, ${situacao})`);
        const collection = await this.getCollection();
        const filter = {
            matricula,
            dia: { $gte: dataInicio, $lte: dataFim },
            falta: true,
            "auditoria.deletadoEm": null
        };
        const update = {
            $set: {
                situacao,
                "auditoria.alteradoPor": funcionarioLogado.idFuncionario,
                "auditoria.alteradoEm": new Date()
            }
        };
        const result = await collection.updateMany(filter, update);
        return result.modifiedCount;
    }
    toRegistro(doc) {
        const registro = new Registro_1.Registro();
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
            const auditoria = new Auditoria_1.Auditoria();
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
    async findById(idRegistro) {
        console.log("🟢 RegistroDAO.findById()");
        const collection = await this.getCollection();
        const filter = {
            _id: new mongodb_1.ObjectId(idRegistro),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toRegistro(doc) : null;
    }
    async findAll() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }
    async findFaltasNoPeriodo(dataInicio, dataFim) {
        const collection = await this.getCollection();
        const cursor = collection.find({
            dia: { $gte: dataInicio, $lte: dataFim },
            falta: true,
            situacao: { $nin: ["Abonada", "Dispensada"] },
            "auditoria.deletadoEm": null
        });
        return (await cursor.toArray()).map(doc => this.toRegistro(doc));
    }
    async findAllDeleted() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }
    async count() {
        console.log("🟢 RegistroDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }
    async findByField(field, value) {
        console.log(`🟢 RegistroDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "matricula", "codDisciplina"];
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
        return docs.map(doc => this.toRegistro(doc));
    }
    async findAusentesEntrada(matriculas, dia) {
        console.log(`🟢 RegistroDAO.findAusentesEntrada() - Matriculas: ${matriculas.length}, Dia: ${dia}`);
        const collection = await this.getCollection();
        const inicioDia = new Date(dia);
        inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date(dia);
        fimDia.setHours(23, 59, 59, 999);
        const filter = {
            matricula: { $in: matriculas },
            dia: { $gte: inicioDia, $lte: fimDia },
            falta: true,
            "auditoria.deletadoEm": null
        };
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }
    async findChamadaPorTurmaEDia(turma, dia) {
        const collection = await this.getCollection();
        const inicioDia = new Date(Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), 0, 0, 0, 0));
        const fimDia = new Date(Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), 23, 59, 59, 999));
        const docs = await collection.find({
            turma,
            codDisciplina: "GERAL",
            dia: { $gte: inicioDia, $lte: fimDia },
            "auditoria.deletadoEm": null
        }).toArray();
        return docs.map(doc => this.toRegistro(doc));
    }
}
exports.RegistroDAO = RegistroDAO;
//# sourceMappingURL=RegistroDAO.js.map