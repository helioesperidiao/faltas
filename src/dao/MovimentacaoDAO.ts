import { Collection, Document, Filter, OptionalId, ObjectId } from "mongodb";
import { Movimentacao } from "../models/Movimentacao";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "../models/Funcionario";
import { Auditoria } from "../models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("MovimentacaoDAO");

/**
 * Executa operações de persistência e consulta da coleção de movimentações.
 */
export class MovimentacaoDAO {
    constructor(private readonly database: MongoDatabase) {}

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this.database.getDb();
        return db.collection("movimentacao");
    }

    async create(movimentacao: Movimentacao, funcionario: Funcionario): Promise<Movimentacao> {
        return (await this.createLote([movimentacao], funcionario))[0];
    }

    /** Persiste de uma vez a lista que o inspetor revisou no navegador. */
    async createLote(movimentacoes: Movimentacao[], funcionario: Funcionario): Promise<Movimentacao[]> {
        if (movimentacoes.length === 0) return [];
        movimentacoes.forEach(movimentacao => movimentacao.marcarCriadoPor(funcionario.idFuncionario));
        const documentos: OptionalId<Document>[] = movimentacoes.map(movimentacao => ({
            nomeAluno: movimentacao.nomeAluno,
            matricula: movimentacao.matricula,
            data: movimentacao.data,
            horario: movimentacao.horario,
            tipo: movimentacao.tipo,
            motivo: movimentacao.motivo,
            nomeArquivo: movimentacao.nomeArquivo,
            auditoria: movimentacao.auditoria.toJSON()
        }));
        const collection = await this.getCollection();
        for (let indice = 0; indice < documentos.length; indice++) {
            const doc = documentos[indice];
            const inicio = new Date(Date.UTC(doc.data.getUTCFullYear(), doc.data.getUTCMonth(), doc.data.getUTCDate()));
            const filtro = { matricula: doc.matricula, data: { $gte: inicio, $lt: new Date(inicio.getTime() + 86400000) }, horario: doc.horario, tipo: doc.tipo, "auditoria.deletadoEm": null };
            const anterior = await collection.findOne(filtro, { sort: { data: -1, horario: -1, _id: -1 } });
            if (anterior) {
                if (doc.motivo) await collection.updateOne({ _id: anterior._id }, { $set: { motivo: doc.motivo } });
                movimentacoes[indice].idMovimentacao = anterior._id.toString();
                continue;
            }
            const resultado = await collection.updateOne(filtro, { $setOnInsert: doc }, { upsert: true });
            const existente = resultado.upsertedId || (await collection.findOne(filtro, { sort: { data: -1, horario: -1, _id: -1 } }))?._id;
            if (!existente) throw new Error("Falha ao localizar movimentação.");
            movimentacoes[indice].idMovimentacao = existente.toString();
        }
        return movimentacoes;
    }

    async anexar(id: string, nomeArquivo: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) return false;
        const resultado = await (await this.getCollection()).updateOne({ _id: new ObjectId(id), "auditoria.deletadoEm": null }, { $set: { nomeArquivo } });
        return resultado.matchedCount > 0;
    }

    async buscar(id: string): Promise<Movimentacao | null> {
        if (!ObjectId.isValid(id)) return null;
        const doc = await (await this.getCollection()).findOne({ _id: new ObjectId(id), "auditoria.deletadoEm": null });
        return doc ? this.toMovimentacao(doc) : null;
    }

    async findAll(data?: Date): Promise<Movimentacao[]> {
        log.debug("findAll()", { data });
        const filter: Filter<Document> = { "auditoria.deletadoEm": null };
        if (data) {
            if (isNaN(data.getTime())) throw new Error("data inválida.");
            const inicio = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
            const fim = new Date(inicio.getTime() + 86400000);
            filter.data = { $gte: inicio, $lt: fim };
        }

        const cursor = (await this.getCollection())
            .find(filter)
            .sort({ data: -1, horario: -1, _id: -1 });
        const docs = await cursor.toArray();
        // Duplicatas antigas continuam no banco; a leitura mostra o registro mais recente.
        const unicos = new Map<string, Movimentacao>();
        for (const doc of docs) {
            const item = this.toMovimentacao(doc);
            const chave = JSON.stringify([item.matricula, item.data.toISOString().slice(0, 10), item.horario, item.tipo]);
            if (!unicos.has(chave)) unicos.set(chave, item);
        }
        return [...unicos.values()];
    }

    private toMovimentacao(doc: any): Movimentacao {
        const movimentacao = new Movimentacao();
        movimentacao.idMovimentacao = doc._id.toHexString();
        movimentacao.nomeAluno = doc.nomeAluno;
        movimentacao.matricula = doc.matricula;
        movimentacao.data = new Date(doc.data);
        movimentacao.horario = doc.horario;
        movimentacao.tipo = doc.tipo;
        movimentacao.motivo = doc.motivo || "";
        movimentacao.nomeArquivo = doc.nomeArquivo || "";
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || "";
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            movimentacao.auditoria = auditoria;
        }
        return movimentacao;
    }
}