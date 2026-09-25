import { Collection, Document, OptionalId } from "mongodb";
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

    async findAll(): Promise<Movimentacao[]> {
        const docs = await (await this.getCollection())
            .find({ "auditoria.deletadoEm": null })
            .sort({ data: -1, horario: -1 })
            .limit(200)
            .toArray();
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
