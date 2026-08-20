import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";

export class CargoDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ CargoDAO.constructor()");
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("cargo");
    }

    public async create(cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> {
        console.log("🟢 CargoDAO.create()");
        const collection = await this.getCollection();

        // Registra auditoria: quem criou
        cargo.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            nomeCargo: cargo.nomeCargo,
            auditoria: cargo.auditoria.toJSON()
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir cargo");
        }

        cargo.idCargo = result.insertedId.toString();
        return cargo;
    }

    public async delete(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 CargoDAO.delete(" + objCargoModel.idCargo + ")");
        const collection = await this.getCollection();

        // Marca soft delete na auditoria
        objCargoModel.marcarDeletadoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": objCargoModel.auditoria.deletadoPor,
                "auditoria.deletadoEm": objCargoModel.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    public async update(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 CargoDAO.update()");
        const collection = await this.getCollection();

        // Registra auditoria: quem alterou
        objCargoModel.marcarAlteradoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = {
            $set: {
                nomeCargo: objCargoModel.nomeCargo,
                "auditoria.alteradoPor": objCargoModel.auditoria.alteradoPor,
                "auditoria.alteradoEm": objCargoModel.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    public async findAll(): Promise<Cargo[]> {
        console.log("🟢 CargoDAO.findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null })
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    public async findAllDeleted(): Promise<Cargo[]> {
        console.log("🟢 CargoDAO.findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    public async findById(idCargo: string): Promise<Cargo | null> {
        console.log("🟢 CargoDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idCargo),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }

    public async findByField(field: string, value: any): Promise<Cargo[]> {
        console.log(`🟢 CargoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "nomeCargo"];
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
        return docs.map(doc => this.toCargo(doc));
    }

    public async count(): Promise<number> {
        console.log("🟢 CargoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    private toCargo(doc: any): Cargo {
        const cargo = new Cargo();
        cargo.idCargo = doc._id.toHexString();
        cargo.nomeCargo = doc.nomeCargo;
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            cargo.auditoria = auditoria;
        }
        return cargo;
    }
}