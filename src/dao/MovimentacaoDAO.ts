import { Collection, Document, Filter, OptionalId } from "mongodb";
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
        log.debug("create()", {
            matricula: movimentacao.matricula,
            tipo: movimentacao.tipo,
            horario: movimentacao.horario,
        });
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
        if (!result.insertedId) {
            log.error("falha ao inserir movimentação", { matricula: movimentacao.matricula });
            throw new Error("Falha ao inserir movimentação.");
        }
        movimentacao.idMovimentacao = result.insertedId.toString();
        log.info("movimentação inserida", {
            idMovimentacao: movimentacao.idMovimentacao,
            matricula: movimentacao.matricula,
            tipo: movimentacao.tipo,
        });
        return movimentacao;
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
            auditoria: movimentacao.auditoria.toJSON()
        }));
        const resultado = await (await this.getCollection()).insertMany(documentos);
        movimentacoes.forEach((movimentacao, indice) => {
            movimentacao.idMovimentacao = resultado.insertedIds[indice].toString();
        });
        return movimentacoes;
    }

    async findAll(data?: Date): Promise<Movimentacao[]> {
        log.debug("findAll()", { data });
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