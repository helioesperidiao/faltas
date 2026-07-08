import { Db, Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Cargo } from "../models/Cargo"; // ajuste o caminho conforme sua estrutura

/**
 * Classe responsável por operações no banco de dados
 * relacionadas à entidade Cargo, utilizando MongoDB.
 * 
 * Implementa métodos CRUD com injeção de dependência
 * de uma instância do Db do MongoDB.
 */
export class CargoDAO {
    private _collection: Collection<Document>;

    /**
     * Construtor do DAO, recebe a instância do Db do MongoDB.
     * 
     * @param {Db} dbInstance - Instância do Db injetada.
     */
    constructor(dbInstance: Db) {
        console.log("⬆️  CargoDAO.constructor()");
        this._collection = dbInstance.collection("cargo");
    }

    /**
     * Cria um novo cargo no banco de dados.
     * 
     * @param {Cargo} objCargoModel - Objeto Cargo contendo os dados do cargo.
     * @returns {Promise<string>} ID do cargo criado (como string).
     * @throws {Error} Caso a inserção falhe.
     */
    async create(objCargoModel: Cargo): Promise<string> {
        console.log("🟢 CargoDAO.create()");

        // Converte o objeto Cargo para um documento MongoDB
        const doc: OptionalId<Document> = {
            nomeCargo: objCargoModel.nomeCargo,
        };

        const result = await this._collection.insertOne(doc);

        if (!result.insertedId) {
            throw new Error("Falha ao inserir cargo");
        }

        return result.insertedId.toHexString();
    }

    /**
     * Remove um cargo do banco de dados pelo ID.
     * 
     * @param {Cargo} objCargoModel - Objeto Cargo contendo o ID do cargo a ser removido.
     * @returns {Promise<boolean>} True se a exclusão foi bem-sucedida.
     */
    async delete(objCargoModel: Cargo): Promise<boolean> {
        console.log("🟢 CargoDAO.delete()");

        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const result = await this._collection.deleteOne(filter);

        return result.deletedCount > 0;
    }

    /**
     * Atualiza os dados de um cargo existente.
     * 
     * @param {Cargo} objCargoModel - Objeto Cargo contendo ID e novos dados do cargo.
     * @returns {Promise<boolean>} True se a atualização foi bem-sucedida.
     */
    async update(objCargoModel: Cargo): Promise<boolean> {
        console.log("🟢 CargoDAO.update()");

        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = { 
            $set: { nomeCargo: objCargoModel.nomeCargo } 
        };

        const result = await this._collection.updateOne(filter, update);

        return result.modifiedCount > 0;
    }

    /**
     * Retorna todos os cargos cadastrados no banco de dados.
     * 
     * @returns {Promise<Array<Cargo>>} Lista de cargos.
     */
    async findAll(): Promise<Cargo[]> {
        console.log("🟢 CargoDAO.findAll()");

        const cursor = this._collection.find({});
        const docs = await cursor.toArray();

        // Converte cada documento para uma instância de Cargo
        return docs.map(doc => this._documentToCargo(doc));
    }

    /**
     * Busca um cargo pelo ID.
     * 
     * @param {string} idCargo - ID do cargo a ser buscado (string hex).
     * @returns {Promise<Cargo|null>} Objeto Cargo encontrado ou null.
     */
    async findById(idCargo: string): Promise<Cargo | null> {
        console.log("🟢 CargoDAO.findById()");

        const filter: Filter<Document> = { _id: new ObjectId(idCargo) };
        const doc = await this._collection.findOne(filter);

        return doc ? this._documentToCargo(doc) : null;
    }

    /**
     * Busca cargos por um campo específico.
     * 
     * @param {string} field - Nome do campo para busca (permitidos: "_id", "nomeCargo").
     * @param {*} value - Valor a ser buscado.
     * @returns {Promise<Array<Cargo>>} Lista de cargos encontrados.
     * @throws {Error} Caso o campo informado não seja permitido.
     */
    async findByField(field: string, value: any): Promise<Cargo[]> {
        console.log(`🟢 CargoDAO.findByField() - Campo: ${field}, Valor: ${value}`);

        const allowedFields = ["_id", "nomeCargo"];
        if (!allowedFields.includes(field)) {
            throw new Error(`Campo inválido para busca: ${field}`);
        }

        // Se for _id, precisamos converter para ObjectId
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = { _id: new ObjectId(value) };
        } else {
            filter = { [field]: value };
        }

        const cursor = this._collection.find(filter);
        const docs = await cursor.toArray();

        return docs.map(doc => this._documentToCargo(doc));
    }

    /**
     * Método auxiliar para converter um documento MongoDB em uma instância de Cargo.
     * 
     * @param {Document} doc - Documento do MongoDB.
     * @returns {Cargo} Instância da classe Cargo.
     * @private
     */
    private _documentToCargo(doc: any): Cargo {
        const cargo = new Cargo();
        // O _id é um ObjectId, convertemos para string
        cargo.idCargo = doc._id.toHexString(); 
        cargo.nomeCargo = doc.nomeCargo;
        return cargo;
    }
}