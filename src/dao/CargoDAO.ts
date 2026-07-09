import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";

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

    async create(objCargoModel: Cargo): Promise<string> {
        console.log("🟢 CargoDAO.create()");
        const collection = await this.getCollection();
        const doc: OptionalId<Document> = {
            nomeCargo: objCargoModel.nomeCargo,
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir cargo");
        }
        return result.insertedId.toHexString();
    }

    async delete(objCargoModel: Cargo): Promise<boolean> {
        console.log("🟢 CargoDAO.delete("+objCargoModel.idCargo+")");
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }

    async update(objCargoModel: Cargo): Promise<boolean> {
        console.log("🟢 CargoDAO.update()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = { 
            $set: { nomeCargo: objCargoModel.nomeCargo } 
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    async findAll(): Promise<Cargo[]> {
        console.log("🟢 CargoDAO.findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({});
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    async findById(idCargo: string): Promise<Cargo | null> {
        console.log("🟢 CargoDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(idCargo) };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }

    async findByField(field: string, value: any): Promise<Cargo[]> {
        console.log(`🟢 CargoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "nomeCargo"];
        if (!allowedFields.includes(field)) {
            throw new Error(`Campo inválido para busca: ${field}`);
        }
        const collection = await this.getCollection();
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = { _id: new ObjectId(value) };
        } else {
            filter = { [field]: value };
        }
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    /**
     * Converte um documento MongoDB em uma instância de Cargo.
     * Usa os setters para garantir validações.
     */
    private toCargo(doc: any): Cargo {
        const cargo = new Cargo();
        cargo.idCargo = doc._id.toHexString();
        cargo.nomeCargo = doc.nomeCargo;
        return cargo;
    }
}