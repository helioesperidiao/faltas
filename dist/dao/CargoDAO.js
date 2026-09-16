"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoDAO = void 0;
const mongodb_1 = require("mongodb");
const Cargo_1 = require("../models/Cargo");
const Auditoria_1 = require("@/models/Auditoria");
class CargoDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ CargoDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("cargo");
    }
    async create(cargo, funcionarioLogado) {
        console.log("🟢 CargoDAO.create()");
        const collection = await this.getCollection();
        cargo.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const doc = {
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
    async delete(objCargoModel, funcionarioLogado) {
        console.log("🟢 CargoDAO.delete(" + objCargoModel.idCargo + ")");
        const collection = await this.getCollection();
        objCargoModel.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(objCargoModel.idCargo) };
        const update = {
            $set: {
                "auditoria.deletadoPor": objCargoModel.auditoria.deletadoPor,
                "auditoria.deletadoEm": objCargoModel.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async update(objCargoModel, funcionarioLogado) {
        console.log("🟢 CargoDAO.update()");
        const collection = await this.getCollection();
        objCargoModel.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter = { _id: new mongodb_1.ObjectId(objCargoModel.idCargo) };
        const update = {
            $set: {
                nomeCargo: objCargoModel.nomeCargo,
                "auditoria.alteradoPor": objCargoModel.auditoria.alteradoPor,
                "auditoria.alteradoEm": objCargoModel.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async findAll() {
        console.log("🟢 CargoDAO.findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }
    async findAllDeleted() {
        console.log("🟢 CargoDAO.findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }
    async findById(idCargo) {
        console.log("🟢 CargoDAO.findById()");
        const collection = await this.getCollection();
        const filter = {
            _id: new mongodb_1.ObjectId(idCargo),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }
    async findByField(field, value) {
        console.log(`🟢 CargoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "nomeCargo"];
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
        return docs.map(doc => this.toCargo(doc));
    }
    async count() {
        console.log("🟢 CargoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }
    toCargo(doc) {
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = doc._id.toHexString();
        cargo.nomeCargo = doc.nomeCargo;
        if (doc.auditoria) {
            const auditoria = new Auditoria_1.Auditoria();
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
exports.CargoDAO = CargoDAO;
//# sourceMappingURL=CargoDAO.js.map