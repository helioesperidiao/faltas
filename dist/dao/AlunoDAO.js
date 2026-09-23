"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlunoDAO = void 0;
const mongodb_1 = require("mongodb");
const Aluno_1 = require("../models/Aluno");
const Auditoria_1 = require("@/models/Auditoria");
class AlunoDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ AlunoDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("aluno");
    }
    async create(aluno, funcionarioLogado) {
        console.log("🟢 AlunoDAO.create()");
        const collection = await this.getCollection();
        aluno.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const doc = {
            matricula: aluno.matricula,
            alunoNome: aluno.alunoNome,
            turma: aluno.turma,
            curso: aluno.curso,
            serie: aluno.serie,
            situacao: aluno.situacao,
            ano: aluno.ano,
            dataNascimento: aluno.dataNascimento,
            alunoRG: aluno.alunoRG,
            alunoFone: aluno.alunoFone,
            alunoEmail: aluno.alunoEmail,
            alunoFoneCel: aluno.alunoFoneCel,
            paiNome: aluno.paiNome,
            paiFoneCel: aluno.paiFoneCel,
            paiFoneFixo: aluno.paiFoneFixo,
            paiFoneRecado: aluno.paiFoneRecado,
            paiEmail: aluno.paiEmail,
            maeNome: aluno.maeNome,
            maeFoneCel: aluno.maeFoneCel,
            maeFoneFixo: aluno.maeFoneFixo,
            maeFoneRecado: aluno.maeFoneRecado,
            maeEmail: aluno.maeEmail,
            finanNome: aluno.finanNome,
            finanFone: aluno.finanFone,
            legalNome: aluno.legalNome,
            legalFone: aluno.legalFone,
            auditoria: aluno.auditoria.toJSON()
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir aluno");
        }
        aluno.idAluno = result.insertedId.toString();
        return aluno;
    }
    async delete(aluno, funcionarioLogado) {
        console.log("🟢 AlunoDAO.delete(" + aluno.idAluno + ")");
        const collection = await this.getCollection();
        aluno.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(aluno.idAluno) };
        const update = {
            $set: {
                "auditoria.deletadoPor": aluno.auditoria.deletadoPor,
                "auditoria.deletadoEm": aluno.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async update(aluno, funcionarioLogado) {
        console.log("🟢 AlunoDAO.update(" + aluno.idAluno + ")");
        const collection = await this.getCollection();
        aluno.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(aluno.idAluno) };
        const update = {
            $set: {
                alunoNome: aluno.alunoNome,
                turma: aluno.turma,
                curso: aluno.curso,
                serie: aluno.serie,
                situacao: aluno.situacao,
                ano: aluno.ano,
                dataNascimento: aluno.dataNascimento,
                alunoRG: aluno.alunoRG,
                alunoFone: aluno.alunoFone,
                alunoEmail: aluno.alunoEmail,
                alunoFoneCel: aluno.alunoFoneCel,
                paiNome: aluno.paiNome,
                paiFoneCel: aluno.paiFoneCel,
                paiFoneFixo: aluno.paiFoneFixo,
                paiFoneRecado: aluno.paiFoneRecado,
                paiEmail: aluno.paiEmail,
                maeNome: aluno.maeNome,
                maeFoneCel: aluno.maeFoneCel,
                maeFoneFixo: aluno.maeFoneFixo,
                maeFoneRecado: aluno.maeFoneRecado,
                maeEmail: aluno.maeEmail,
                finanNome: aluno.finanNome,
                finanFone: aluno.finanFone,
                legalNome: aluno.legalNome,
                legalFone: aluno.legalFone,
                "auditoria.alteradoPor": aluno.auditoria.alteradoPor,
                "auditoria.alteradoEm": aluno.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    toAluno(doc) {
        const corrigirAcentos = (valor) => {
            if (!/[ÃÂ�]/.test(valor || ''))
                return valor || '';
            try {
                return decodeURIComponent(escape(valor));
            }
            catch {
                return valor || '';
            }
        };
        const aluno = new Aluno_1.Aluno();
        aluno.idAluno = doc._id.toHexString();
        aluno.matricula = corrigirAcentos(doc.matricula);
        aluno.alunoNome = corrigirAcentos(doc.alunoNome);
        aluno.turma = corrigirAcentos(doc.turma);
        aluno.curso = corrigirAcentos(doc.curso);
        aluno.serie = corrigirAcentos(doc.serie);
        aluno.situacao = doc.situacao || 'Ativo';
        aluno.ano = doc.ano || '';
        aluno.dataNascimento = doc.dataNascimento || '';
        aluno.alunoRG = doc.alunoRG || '';
        aluno.alunoFone = doc.alunoFone || '';
        aluno.alunoEmail = doc.alunoEmail || '';
        aluno.alunoFoneCel = doc.alunoFoneCel || '';
        aluno.paiNome = doc.paiNome || '';
        aluno.paiFoneCel = doc.paiFoneCel || '';
        aluno.paiFoneFixo = doc.paiFoneFixo || '';
        aluno.paiFoneRecado = doc.paiFoneRecado || '';
        aluno.paiEmail = doc.paiEmail || '';
        aluno.maeNome = doc.maeNome || '';
        aluno.maeFoneCel = doc.maeFoneCel || '';
        aluno.maeFoneFixo = doc.maeFoneFixo || '';
        aluno.maeFoneRecado = doc.maeFoneRecado || '';
        aluno.maeEmail = doc.maeEmail || '';
        aluno.finanNome = doc.finanNome || '';
        aluno.finanFone = doc.finanFone || '';
        aluno.legalNome = doc.legalNome || '';
        aluno.legalFone = doc.legalFone || '';
        if (doc.auditoria) {
            const auditoria = new Auditoria_1.Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            aluno.auditoria = auditoria;
        }
        return aluno;
    }
    async findById(idAluno) {
        console.log("🟢 AlunoDAO.findById()");
        const collection = await this.getCollection();
        const filter = {
            _id: new mongodb_1.ObjectId(idAluno),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toAluno(doc) : null;
    }
    async findAll() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAluno(doc));
    }
    async findAllDeleted() {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toAluno(doc));
    }
    async count() {
        console.log("🟢 AlunoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }
    async findByField(field, value) {
        console.log(`🟢 AlunoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "matricula", "turma"];
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
        return docs.map(doc => this.toAluno(doc));
    }
}
exports.AlunoDAO = AlunoDAO;
//# sourceMappingURL=AlunoDAO.js.map