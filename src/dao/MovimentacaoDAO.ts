import { Collection, Document, Filter, OptionalId } from "mongodb";
import { Movimentacao } from "../models/Movimentacao";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "../models/Funcionario";
import { Auditoria } from "../models/Auditoria";

export class MovimentacaoDAO {
    constructor(private readonly database: MongoDatabase) {}

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this.database.getDb();
        return db.collection("movimentacao");
    }

    async create(movimentacao: Movimentacao, funcionario: Funcionario): Promise<Movimentacao> {
        movimentacao.marcarCriadoPor(funcionario.idFuncionario);
        const doc: OptionalId<Document> = {
            nomeAluno: movimentacao.nomeAluno,
            matricula: movimentacao.matricula,
            data: movimentacao.data,
            horario: movimentacao.horario,
            tipo: movimentacao.tipo,
            auditoria: movimentacao.auditoria.toJSON()
        };
        const result = await (await this.getCollection()).insertOne(doc);
        if (!result.insertedId) throw new Error("Falha ao inserir movimentação.");
        movimentacao.idMovimentacao = result.insertedId.toString();
        return movimentacao;
    }

    async findAll(data?: Date): Promise<Movimentacao[]> {
        const filter: Filter<Document> = { "auditoria.deletadoEm": null };
        if (data) {
            if (isNaN(data.getTime())) throw new Error("data inválida.");
            const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
            const fim = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
            filter.data = { $gte: inicio, $lt: fim };
        }

        const cursor = (await this.getCollection())
            .find(filter)
            .sort({ data: -1, horario: -1 });
        if (!data) cursor.limit(200);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toMovimentacao(doc));
    }

    private toMovimentacao(doc: any): Movimentacao {
        const movimentacao = new Movimentacao();
        movimentacao.idMovimentacao = doc._id.toHexString();
        movimentacao.nomeAluno = doc.nomeAluno;
        movimentacao.matricula = doc.matricula;
        movimentacao.data = new Date(doc.data);
        movimentacao.horario = doc.horario;
        movimentacao.tipo = doc.tipo;
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || "";
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            movimentacao.auditoria = auditoria;
        }
        return movimentacao;
    }
}
