import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Funcionario } from "../models/Funcionario";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";

export class FuncionarioDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ FuncionarioDAO.constructor()");
        this._database = dbInstance;
    }

    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("funcionario");
    }

    async create(objFuncionarioModel: Funcionario): Promise<Funcionario> {
        console.log("🟢 FuncionarioDAO.create()");
        const collection = await this.getCollection();

        if (!objFuncionarioModel.cargo) {
            throw new Error("Cargo não informado");
        }

        // Obtém a senha diretamente do campo privado (caso o getter tenha validação)
        const senha = (objFuncionarioModel as any)._senha || objFuncionarioModel.senha || '';

        const doc: OptionalId<Document> = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            senha: senha,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
            cargoId: new ObjectId(objFuncionarioModel.cargo.idCargo),
        };

        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir funcionário");
        }

        objFuncionarioModel.idFuncionario = result.insertedId.toHexString();
        return objFuncionarioModel;
    }

    async delete(objFuncionarioModel: Funcionario): Promise<boolean> {
        console.log(`🟢 FuncionarioDAO.delete(${objFuncionarioModel.idFuncionario})`);
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }

    async update(objFuncionarioModel: Funcionario): Promise<boolean> {
        console.log(`🟢 FuncionarioDAO.update(${objFuncionarioModel.idFuncionario})`);
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };

        const updateData: any = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
        };

        // Obtém a senha do campo privado
        const senha = (objFuncionarioModel as any)._senha || objFuncionarioModel.senha;
        if (senha) {
            updateData.senha = senha;
        }

        if (objFuncionarioModel.cargo?.idCargo) {
            updateData.cargoId = new ObjectId(objFuncionarioModel.cargo.idCargo);
        }

        const update: UpdateFilter<Document> = { $set: updateData };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    async findAll(): Promise<Funcionario[]> {
        console.log("🟢 FuncionarioDAO.findAll()");
        const collection = await this.getCollection();

        const pipeline = [
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1, // ✅ inclui senha
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }

    async findById(idFuncionario: string): Promise<Funcionario | null> {
        console.log(`🟢 FuncionarioDAO.findById(${idFuncionario})`);
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(idFuncionario) };

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1, // ✅ inclui senha
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        if (docs.length === 0) return null;
        return this.toFuncionario(docs[0]);
    }

    async findByField(field: string, value: any): Promise<Funcionario[]> {
        console.log(`🟢 FuncionarioDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId"];
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

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1, // ✅ inclui senha
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }

    /**
     * Busca um funcionário pelo email (para login).
     * Retorna o documento com a senha para validação.
     */
    async findByEmail(email: string): Promise<Funcionario | null> {
        console.log(`🟢 FuncionarioDAO.findByEmail(${email})`);
        const collection = await this.getCollection();

        const pipeline = [
            { $match: { email } },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1, // ✅ inclui senha
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];

        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();

        if (docs.length === 0) {
            return null;
        }

        return this.toFuncionario(docs[0]);
    }

    /**
     * Converte um documento MongoDB em uma instância de Funcionario.
     * Usa os setters para garantir validações.
     */
    private toFuncionario(doc: any): Funcionario {
        const cargo = new Cargo();
        cargo.idCargo = doc.cargo.idCargo.toHexString ? doc.cargo.idCargo.toHexString() : doc.cargo.idCargo;
        cargo.nomeCargo = doc.cargo.nomeCargo;

        const funcionario = new Funcionario();
        funcionario.idFuncionario = doc.idFuncionario.toHexString ? doc.idFuncionario.toHexString() : doc.idFuncionario;
        funcionario.nomeFuncionario = doc.nomeFuncionario;
        funcionario.email = doc.email;
        // Atribui a senha diretamente ao campo privado para evitar validação
        (funcionario as any)._senha = doc.senha || '';
        funcionario.recebeValeTransporte = doc.recebeValeTransporte;
        funcionario.cargo = cargo;

        return funcionario;
    }
}