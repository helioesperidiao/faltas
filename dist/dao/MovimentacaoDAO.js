"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoDAO = void 0;
const Movimentacao_1 = require("../models/Movimentacao");
const Auditoria_1 = require("../models/Auditoria");
class MovimentacaoDAO {
    database;
    constructor(database) {
        this.database = database;
    }
    async getCollection() {
        const db = await this.database.getDb();
        return db.collection("movimentacao");
    }
    async create(movimentacao, funcionario) {
        movimentacao.marcarCriadoPor(funcionario.idFuncionario);
        const doc = {
            nomeAluno: movimentacao.nomeAluno,
            matricula: movimentacao.matricula,
            data: movimentacao.data,
            horario: movimentacao.horario,
            tipo: movimentacao.tipo,
            auditoria: movimentacao.auditoria.toJSON()
        };
        const result = await (await this.getCollection()).insertOne(doc);
        if (!result.insertedId)
            throw new Error("Falha ao inserir movimentação.");
        movimentacao.idMovimentacao = result.insertedId.toString();
        return movimentacao;
    }
    async findAll(data) {
        const filter = { "auditoria.deletadoEm": null };
        if (data) {
            if (isNaN(data.getTime()))
                throw new Error("data inválida.");
            const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
            const fim = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
            filter.data = { $gte: inicio, $lt: fim };
        }
        const cursor = (await this.getCollection())
            .find(filter)
            .sort({ data: -1, horario: -1 });
        if (!data)
            cursor.limit(200);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toMovimentacao(doc));
    }
    toMovimentacao(doc) {
        const movimentacao = new Movimentacao_1.Movimentacao();
        movimentacao.idMovimentacao = doc._id.toHexString();
        movimentacao.nomeAluno = doc.nomeAluno;
        movimentacao.matricula = doc.matricula;
        movimentacao.data = new Date(doc.data);
        movimentacao.horario = doc.horario;
        movimentacao.tipo = doc.tipo;
        if (doc.auditoria) {
            const auditoria = new Auditoria_1.Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || "";
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            movimentacao.auditoria = auditoria;
        }
        return movimentacao;
    }
}
exports.MovimentacaoDAO = MovimentacaoDAO;
//# sourceMappingURL=MovimentacaoDAO.js.map