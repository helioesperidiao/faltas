import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { GradeHorario } from "../models/GradeHorario";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";

export class GradeHorarioDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ GradeHorarioDAO.constructor()");
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
        console.log("🟢 GradeHorarioDAO.create()");
        const collection = await this.getCollection();

        grade.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            turma: grade.turma,
            horaInicio: grade.horaInicio,
            horaFim: grade.horaFim,
            dia: grade.dia,
            cod: grade.cod,
            disciplina: grade.disciplina,
            auditoria: grade.auditoria.toJSON()
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir grade de horário");
        }

        grade.idGradeHorario = result.insertedId.toString();
        return grade;
    }

    public async delete(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 GradeHorarioDAO.delete(" + grade.idGradeHorario + ")");
        const collection = await this.getCollection();
        grade.marcarDeletadoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = { _id: new ObjectId(grade.idGradeHorario) };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": grade.auditoria.deletadoPor,
                "auditoria.deletadoEm": grade.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    public async update(grade: GradeHorario, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 GradeHorarioDAO.update(" + grade.idGradeHorario + ")");
        const collection = await this.getCollection();
        grade.marcarAlteradoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = { _id: new ObjectId(grade.idGradeHorario) };
        const update: UpdateFilter<Document> = {
            $set: {
                turma: grade.turma,
                horaInicio: grade.horaInicio,
                horaFim: grade.horaFim,
                dia: grade.dia,
                cod: grade.cod,
                disciplina: grade.disciplina,
                "auditoria.alteradoPor": grade.auditoria.alteradoPor,
                "auditoria.alteradoEm": grade.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
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
        console.log("🟢 GradeHorarioDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idGradeHorario),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toGradeHorario(doc) : null;
    }

    public async findAll(): Promise<GradeHorario[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }

    public async findAllDeleted(): Promise<GradeHorario[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toGradeHorario(doc));
    }

    public async count(): Promise<number> {
        console.log("🟢 GradeHorarioDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    public async findByField(field: string, value: any): Promise<GradeHorario[]> {
        console.log(`🟢 GradeHorarioDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "turma", "cod", "dia"];
        if (!allowedFields.includes(field)) {
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
}
