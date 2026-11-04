import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { GradeHorario } from "../models/GradeHorario";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("GradeHorarioDAO");

/**
 * Executa operações de persistência e consulta da coleção de grades de horário.
 *
 * Recalcula automaticamente a carga semanal de cada disciplina/turma ao
 * criar, atualizar ou excluir uma aula.
 */
export class GradeHorarioDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("gradeHorario");
    }

    private corrigirAcentos(valor: string): string {
        if (!/[ÃÂ�]/.test(valor)) return valor;
        try {
            return decodeURIComponent(escape(valor))
                .replace(/Administra�+o/g, "Administração")
                .replace(/Ter�+a-feira/g, "Terça-feira")
                .replace(/Organiza��o/g, "Organização")
                .replace(/M�todos/g, "Métodos");
        } catch {
            return valor
                .replace(/Administra�+o/g, "Administração")
                .replace(/Ter�+a-feira/g, "Terça-feira")
                .replace(/Organiza��o/g, "Organização")
                .replace(/M�todos/g, "Métodos");
        }
    }

    public async create(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<GradeHorario> {
        log.debug("create()", { turma: grade.turma, cod: grade.cod, dia: grade.dia });
        const collection = await this.getCollection();

        grade.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            turma: grade.turma,
            horaInicio: grade.horaInicio,
            horaFim: grade.horaFim,
            dia: grade.dia,
            cod: grade.cod,
            disciplina: grade.disciplina,
            duracaoAulaMinutos: GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim),
            cargaHorariaSemanalMinutos: GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim),
            auditoria: grade.auditoria.toJSON()
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            log.error("falha ao inserir grade de horário", { turma: grade.turma, cod: grade.cod });
            throw new Error("Falha ao inserir grade de horário");
        }

        grade.idGradeHorario = result.insertedId.toString();
        const carga = await this.recalcularCargaHorariaSemanal(grade.turma, grade.cod);
        grade.duracaoAulaMinutos = GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim);
        grade.cargaHorariaSemanalMinutos = carga;
        log.info("grade de horário inserida", {
            idGradeHorario: grade.idGradeHorario,
            turma: grade.turma,
            cod: grade.cod,
        });
        return grade;
    }

    public async delete(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("delete()", { idGradeHorario: grade.idGradeHorario });
        const collection = await this.getCollection();
        grade.marcarDeletadoPor(funcionarioLogado.idFuncionario);

        const gradeExistente = await collection.findOne({ _id: new ObjectId(grade.idGradeHorario) });
        const filter: Filter<Document> = {
            _id: new ObjectId(grade.idGradeHorario),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": grade.auditoria.deletadoPor,
                "auditoria.deletadoEm": grade.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        if (result.modifiedCount > 0 && gradeExistente) {
            await this.recalcularCargaHorariaSemanal(gradeExistente.turma, gradeExistente.cod);
        }
        const ok = result.modifiedCount > 0;
        if (ok) log.info("grade de horário removida", { idGradeHorario: grade.idGradeHorario });
        else log.warn("grade de horário não encontrada para remoção", { idGradeHorario: grade.idGradeHorario });
        return ok;
    }

    public async update(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("update()", { idGradeHorario: grade.idGradeHorario });
        const collection = await this.getCollection();
        grade.marcarAlteradoPor(funcionarioLogado.idFuncionario);

        const gradeExistente = await collection.findOne({ _id: new ObjectId(grade.idGradeHorario) });
        const duracaoAulaMinutos = GradeHorario.calcularDuracaoMinutos(grade.horaInicio, grade.horaFim);
        const filter: Filter<Document> = { _id: new ObjectId(grade.idGradeHorario) };
        const update: UpdateFilter<Document> = {
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
        const ok = result.modifiedCount > 0;
        if (ok) {
            if (gradeExistente) {
                await this.recalcularCargaHorariaSemanal(gradeExistente.turma, gradeExistente.cod);
            }
            const carga = await this.recalcularCargaHorariaSemanal(grade.turma, grade.cod);
            grade.duracaoAulaMinutos = duracaoAulaMinutos;
            grade.cargaHorariaSemanalMinutos = carga;
            log.info("grade de horário atualizada", { idGradeHorario: grade.idGradeHorario });
        } else {
            log.warn("grade de horário não encontrada para atualização", { idGradeHorario: grade.idGradeHorario });
        }
        return ok;
    }

    private toGradeHorario(doc: any): GradeHorario {
        const grade = new GradeHorario();
        grade.idGradeHorario = doc._id.toHexString();
        grade.turma = doc.turma;
        grade.horaInicio = doc.horaInicio;
        grade.horaFim = doc.horaFim;
        grade.dia = this.corrigirAcentos(doc.dia);
        grade.cod = this.corrigirAcentos(doc.cod);
        grade.disciplina = this.corrigirAcentos(doc.disciplina);
        grade.duracaoAulaMinutos = doc.duracaoAulaMinutos || GradeHorario.calcularDuracaoMinutos(doc.horaInicio, doc.horaFim);
        grade.cargaHorariaSemanalMinutos = doc.cargaHorariaSemanalMinutos || grade.duracaoAulaMinutos;
        if (doc.auditoria) {
            const auditoria = new Auditoria();
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

    public async findById(idGradeHorario: string): Promise<GradeHorario | null> {
        log.debug("findById()", { idGradeHorario });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idGradeHorario),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toGradeHorario(doc) : null;
    }

    public async findAll(): Promise<GradeHorario[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }

    public async findAllDeleted(): Promise<GradeHorario[]> {
        log.debug("findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }

    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    public async findByField(field: string, value: any): Promise<GradeHorario[]> {
        log.debug("findByField()", { field, value });
        const allowedFields = ["_id", "turma", "cod", "dia"];
        if (!allowedFields.includes(field)) {
            log.warn("campo inválido para busca", { field });
            throw new Error(`Campo inválido para busca: ${field}`);
        }
        const collection = await this.getCollection();
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = {
                _id: new ObjectId(value),
                "auditoria.deletadoEm": null
            };
        } else {
            filter = {
                [field]: value,
                "auditoria.deletadoEm": null
            };
        }
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }

    /** Recalcula e persiste a carga semanal para todas as aulas da mesma disciplina/turma. */
    public async recalcularCargaHorariaSemanal(turma: string, cod: string): Promise<number> {
        log.debug("recalcularCargaHorariaSemanal()", { turma, cod });
        const collection = await this.getCollection();
        const aulas = await collection.find({ turma, cod, "auditoria.deletadoEm": null }).toArray();
        const cargaHorariaSemanalMinutos = aulas.reduce(
            (total, aula) => total + GradeHorario.calcularDuracaoMinutos(aula.horaInicio, aula.horaFim),
            0
        );

        if (aulas.length > 0) {
            await collection.updateMany(
                { turma, cod, "auditoria.deletadoEm": null },
                { $set: { cargaHorariaSemanalMinutos } }
            );
        }
        log.debug("recalcularCargaHorariaSemanal() concluído", { turma, cod, cargaHorariaSemanalMinutos });
        return cargaHorariaSemanalMinutos;
    }
}