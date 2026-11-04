import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoDAO");

/**
 * Executa operações de persistência e consulta da coleção de cargos.
 */
export class CargoDAO {
    private _database: MongoDatabase;

    /** Recebe a conexão que será usada para acessar a coleção de cargos. */
    constructor(dbInstance: MongoDatabase) {
        this._database = dbInstance;
    }

    /** Obtém a coleção de cargos do MongoDB. */
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("cargo");
    }

  

    /**
     * Insere um cargo e copia o ID gerado pelo MongoDB para o modelo.
     *
     * @param cargo - Instância de Cargo com os dados a serem inseridos.
     * @param funcionarioLogado - Funcionário autenticado realizando a operação.
     * @returns O mesmo objeto Cargo com o `idCargo` preenchido.
     * @throws {Error} Se a inserção falhar.
     */
    public async create(cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> {
        log.debug("create()", { nomeCargo: cargo.nomeCargo });
        const collection = await this.getCollection();

        // Registra auditoria: quem criou
        cargo.marcarCriadoPor(funcionarioLogado.idFuncionario);

        const doc: OptionalId<Document> = {
            nomeCargo: cargo.nomeCargo,
            auditoria: cargo.auditoria.toJSON()
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            log.error("falha ao inserir cargo", { nomeCargo: cargo.nomeCargo });
            throw new Error("Falha ao inserir cargo");
        }

        cargo.idCargo = result.insertedId.toString();
        log.info("cargo inserido", { idCargo: cargo.idCargo, nomeCargo: cargo.nomeCargo });
        return cargo;
    }

    /**
     * Remove o cargo pelo ObjectId (soft delete) e informa se algum registro foi alterado.
     *
     * @param objCargoModel - Instância de Cargo contendo o `idCargo`.
     * @param funcionarioLogado - Funcionário autenticado realizando a operação.
     * @returns `true` se o documento foi marcado como deletado, `false` caso contrário.
     */
    public async delete(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("delete()", { idCargo: objCargoModel.idCargo });
        const collection = await this.getCollection();

        // Marca soft delete na auditoria
        objCargoModel.marcarDeletadoPor(funcionarioLogado.idFuncionario);

        const filter: Filter<Document> = {
            _id: new ObjectId(objCargoModel.idCargo),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": objCargoModel.auditoria.deletadoPor,
                "auditoria.deletadoEm": objCargoModel.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        const ok = result.modifiedCount > 0;
        if (ok) log.info("cargo removido", { idCargo: objCargoModel.idCargo });
        else log.warn("cargo não encontrado para remoção", { idCargo: objCargoModel.idCargo });
        return ok;
    }

    /**
     * Altera o nome do cargo e informa se o ID correspondeu a um registro.
     *
     * @param objCargoModel - Instância de Cargo com os dados atualizados (deve conter `idCargo`).
     * @param funcionarioLogado - Funcionário autenticado realizando a operação.
     * @returns `true` se o documento foi atualizado, `false` caso contrário.
     */
    public async update(objCargoModel: Cargo, funcionarioLogado: Funcionario): Promise<boolean> {
        log.debug("update()", { idCargo: objCargoModel.idCargo });
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
        const ok = result.modifiedCount > 0;
        if (ok) log.info("cargo atualizado", { idCargo: objCargoModel.idCargo, nomeCargo: objCargoModel.nomeCargo });
        else log.warn("cargo não encontrado para atualização", { idCargo: objCargoModel.idCargo });
        return ok;
    }

    /** Lê todos os documentos ativos e os converte para instâncias de Cargo. */
    public async findAll(): Promise<Cargo[]> {
        log.debug("findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null })
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    /** Lê todos os documentos deletados (soft delete). */
    public async findAllDeleted(): Promise<Cargo[]> {
        log.debug("findAllDeleted()");
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } });
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }

    /** Busca um cargo pelo ID e retorna null quando não for encontrado. */
    public async findById(idCargo: string): Promise<Cargo | null> {
        log.debug("findById()", { idCargo });
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idCargo),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }

    /** Busca por um campo permitido; nomes são comparados sem diferenciar maiúsculas. */
    public async findByField(field: string, value: any): Promise<Cargo[]> {
        log.debug("findByField()", { field, value });
        const allowedFields = ["_id", "nomeCargo"];
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
        return docs.map(doc => this.toCargo(doc));
    }

    /** Conta documentos ativos da coleção de cargos. */
    public async count(): Promise<number> {
        log.debug("count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    /** Converte o formato do documento MongoDB para o modelo da aplicação. */
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