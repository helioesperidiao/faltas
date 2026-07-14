import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";

/**
 * Data Access Object para a entidade Cargo.
 * 
 * Responsável por todas as operações de banco de dados relacionadas a cargos,
 * utilizando MongoDB como storage.
 * 
 * As operações de escrita (create, update, delete) registram auditoria
 * com o ID do funcionário logado. As consultas (findAll, findById, findByField, count)
 * filtram automaticamente registros deletados (soft delete).
 * 
 * @example
 * const cargoDAO = new CargoDAO(mongoDatabase);
 * const novoCargo = await cargoDAO.create(cargo, funcionarioLogado);
 * const todos = await cargoDAO.findAll(); // sem parâmetro
 */
export class CargoDAO {
    private _database: MongoDatabase;

    /**
     * Construtor do CargoDAO.
     * @param dbInstance - Instância do MongoDatabase para acesso ao banco.
     */
    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ CargoDAO.constructor()");
        this._database = dbInstance;
    }

    /**
     * Obtém a coleção "cargo" do banco de dados.
     * @returns Promise com a coleção MongoDB.
     */
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("cargo");
    }

    /**
     * Insere um novo cargo no banco de dados.
     * 
     * Registra auditoria: define o ID do funcionário que criou o cargo.
     * 
     * @param cargo - Instância de Cargo a ser inserida (deve ter nomeCargo preenchido).
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns O mesmo objeto Cargo com o idCargo preenchido pelo MongoDB.
     * @throws {Error} Se a inserção falhar.
     * 
     * @example
     * const cargo = new Cargo();
     * cargo.nomeCargo = "Analista";
     * const cargoCriado = await cargoDAO.create(cargo, funcionarioLogado);
     * console.log(cargoCriado.idCargo);
     */
    public async create(cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> {
        console.log("🟢 CargoDAO.create()");
        const collection = await this.getCollection();
        
        // Registra auditoria: quem criou
        cargo.marcarCriadoPor(funcionarioLogado.idFuncionario);
        
        const doc: OptionalId<Document> = {
            nomeCargo: cargo.nomeCargo,
            auditoria: cargo.auditoria
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir cargo");
        }

        cargo.idCargo = result.insertedId.toString();
        return cargo;
    }

    /**
     * Remove um cargo do banco de dados pelo ID (soft delete).
     * 
     * Em vez de deletar fisicamente, marca o registro como deletado,
     * registrando o ID do funcionário que realizou a exclusão.
     * 
     * @param objCargoModel - Objeto Cargo contendo o idCargo a ser removido.
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns `true` se um documento foi atualizado (marcado como deletado), `false` caso contrário.
     * 
     * @example
     * const cargo = new Cargo();
     * cargo.idCargo = "67a1b2c3d4e5f6a7b8c9d0e1";
     * const removido = await cargoDAO.delete(cargo, funcionarioLogado);
     */
    public async delete(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 CargoDAO.delete(" + objCargoModel.idCargo + ")");
        const collection = await this.getCollection();
        
        // Marca soft delete na auditoria
        objCargoModel.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        
        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = {
            $set: { 
                auditoria: objCargoModel.auditoria 
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    /**
     * Atualiza os dados de um cargo existente.
     * 
     * Registra auditoria: define o ID do funcionário que alterou o cargo.
     * 
     * @param objCargoModel - Objeto Cargo com o idCargo e os novos dados (nomeCargo).
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns `true` se o documento foi atualizado, `false` caso contrário.
     * 
     * @example
     * const cargo = new Cargo();
     * cargo.idCargo = "67a1b2c3d4e5f6a7b8c9d0e1";
     * cargo.nomeCargo = "Gerente Sênior";
     * const atualizado = await cargoDAO.update(cargo, funcionarioLogado);
     */
    public async update(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean> {
        console.log("🟢 CargoDAO.update()");
        const collection = await this.getCollection();
        
        // Registra auditoria: quem alterou
        objCargoModel.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        
        const filter: Filter<Document> = { _id: new ObjectId(objCargoModel.idCargo) };
        const update: UpdateFilter<Document> = {
            $set: { 
                nomeCargo: objCargoModel.nomeCargo,
                auditoria: objCargoModel.auditoria 
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    /**
     * Retorna todos os cargos cadastrados no banco de dados.
     * 
     * Filtra automaticamente registros deletados (soft delete).
     * 
     * @returns Array de instâncias de Cargo.
     * 
     * @example
     * const todosCargos = await cargoDAO.findAll();
     * todosCargos.forEach(c => console.log(c.nomeCargo));
     */
    public async findAll(): Promise<Cargo[]> {
        console.log("🟢 CargoDAO.findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $exists: false } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    /**
     * Busca um cargo pelo ID.
     * 
     * Filtra automaticamente registros deletados (soft delete).
     * 
     * @param idCargo - ID do cargo no formato string hex.
     * @returns O cargo encontrado ou `null` se não existir.
     * 
     * @example
     * const cargo = await cargoDAO.findById("67a1b2c3d4e5f6a7b8c9d0e1");
     * if (cargo) console.log(cargo.nomeCargo);
     */
    public async findById(idCargo: string): Promise<Cargo | null> {
        console.log("🟢 CargoDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = { 
            _id: new ObjectId(idCargo),
            "auditoria.deletadoEm": { $exists: false } 
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }

    /**
     * Busca cargos por um campo específico (somente "_id" ou "nomeCargo").
     * 
     * Filtra automaticamente registros deletados (soft delete).
     * 
     * @param field - Nome do campo ("_id" ou "nomeCargo").
     * @param value - Valor a ser pesquisado.
     * @returns Array de cargos que correspondem ao filtro.
     * @throws {Error} Se o campo não for permitido.
     * 
     * @example
     * const cargos = await cargoDAO.findByField("nomeCargo", "Administrador");
     */
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
                "auditoria.deletadoEm": { $exists: false } 
            };
        } else {
            filter = { 
                [field]: value,
                "auditoria.deletadoEm": { $exists: false } 
            };
        }
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    /**
     * Retorna a quantidade total de cargos cadastrados.
     * 
     * Filtra automaticamente registros deletados (soft delete).
     * 
     * @returns Número total de cargos.
     * 
     * @example
     * const total = await cargoDAO.count();
     * console.log(`Existem ${total} cargos.`);
     */
    public async count(): Promise<number> {
        console.log("🟢 CargoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": { $exists: false } });
    }

    /**
     * Converte um documento do MongoDB em uma instância de Cargo.
     * 
     * Inclui a restauração do objeto de auditoria a partir do documento.
     * 
     * @param doc - Documento bruto do MongoDB (deve conter _id, nomeCargo e auditoria).
     * @returns Instância de Cargo com os dados do documento.
     * @private
     */
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