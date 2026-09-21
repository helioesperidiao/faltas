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
            turmaInicioEm: aluno.turmaInicioEm,
            historicoTurmas: aluno.historicoTurmas,
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
        const filter = {
            _id: new mongodb_1.ObjectId(aluno.idAluno),
            "auditoria.deletadoEm": null
        };
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
                turmaInicioEm: aluno.turmaInicioEm,
                historicoTurmas: aluno.historicoTurmas,
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
        const aluno = new Aluno_1.Aluno();
        aluno.idAluno = doc._id.toHexString();
        aluno.matricula = doc.matricula;
        aluno.alunoNome = doc.alunoNome;
        aluno.turma = doc.turma;
        aluno.curso = doc.curso || '';
        aluno.serie = doc.serie || '';
        aluno.situacao = doc.situacao || 'Ativo';
        aluno.ano = doc.ano || '';
        aluno.turmaInicioEm = doc.turmaInicioEm ? new Date(doc.turmaInicioEm) : this.inicioAnoLetivo(doc.ano);
        aluno.historicoTurmas = Array.isArray(doc.historicoTurmas)
            ? doc.historicoTurmas.map((item) => ({
                turma: item.turma || '',
                curso: item.curso || '',
                serie: item.serie || '',
                ano: String(item.ano || ''),
                inicioEm: item.inicioEm ? new Date(item.inicioEm) : this.inicioAnoLetivo(item.ano),
                fimEm: item.fimEm ? new Date(item.fimEm) : new Date(),
                disponivelAte: item.disponivelAte ? new Date(item.disponivelAte) : new Date()
            }))
            : [];
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
    inicioAnoLetivo(ano) {
        const anoNumerico = Number(ano);
        return new Date(Number.isInteger(anoNumerico) && anoNumerico >= 2000 ? anoNumerico : new Date().getFullYear(), 0, 1);
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
    async findByTurmaNoPeriodo(turma, dataInicio, dataFim) {
        const alunos = await this.findAll();
        const agora = new Date();
        const diaUtc = (data) => Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
        const inicioConsulta = diaUtc(dataInicio);
        const fimConsulta = diaUtc(dataFim);
        const hoje = diaUtc(agora);
        return alunos.filter(aluno => {
            const inicioTurmaAtual = diaUtc(aluno.turmaInicioEm);
            const vinculoAtual = aluno.turma === turma && inicioTurmaAtual <= fimConsulta;
            const vinculoHistorico = aluno.historicoTurmas.some(historico => historico.turma === turma &&
                diaUtc(historico.inicioEm) <= fimConsulta &&
                diaUtc(historico.fimEm) >= inicioConsulta &&
                diaUtc(historico.disponivelAte) >= hoje);
            return vinculoAtual || vinculoHistorico;
        });
    }
    async atualizarEnturmacaoEmLote(alunos, funcionarioLogado) {
        if (alunos.length === 0) {
            return 0;
        }
        const collection = await this.getCollection();
        const agora = new Date();
        const result = await collection.bulkWrite(alunos.map(aluno => ({
            updateOne: {
                filter: { _id: new mongodb_1.ObjectId(aluno.idAluno), "auditoria.deletadoEm": null },
                update: {
                    $set: {
                        turma: aluno.turma,
                        serie: aluno.serie,
                        ano: aluno.ano,
                        turmaInicioEm: aluno.turmaInicioEm,
                        historicoTurmas: aluno.historicoTurmas,
                        "auditoria.alteradoPor": funcionarioLogado.idFuncionario,
                        "auditoria.alteradoEm": agora
                    }
                }
            }
        })));
        return result.modifiedCount;
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