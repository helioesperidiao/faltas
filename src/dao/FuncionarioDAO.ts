import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Funcionario } from "../models/Funcionario";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";

export class FuncionarioDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️  FuncionarioDAO.constructor()");
        this._database = dbInstance;
    }

    private async getFuncionarioCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("funcionario");
    }



    /**
     * Insere um novo funcionário no banco.
     * A senha já deve vir criptografada.
     */
    async create(objFuncionarioModel: Funcionario): Promise<string> {
        console.log(`🟢 FuncionarioDAO.create(${objFuncionarioModel.email})`);

        if (!objFuncionarioModel.cargo) {
            throw new Error("Cargo não informado");
        }

        const cargoId = objFuncionarioModel.cargo.idCargo;

        // Busca o cargo apenas para obter o ObjectId (não valida existência, isso é feito no Service)
        // Mas ainda precisamos garantir que o cargoId é um ObjectId válido
        const cargoObjectId = new ObjectId(cargoId);

        const doc: OptionalId<Document> = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            senha: objFuncionarioModel.senha, // Já deve vir hash
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
            cargoId: cargoObjectId,
        };

        const funcionarioCollection = await this.getFuncionarioCollection();
        const result = await funcionarioCollection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir funcionário");
        }
        return result.insertedId.toHexString();
    }

    async delete(idFuncionario: string): Promise<boolean> {
        console.log(`🟢 FuncionarioDAO.delete(${idFuncionario})`);
        const collection = await this.getFuncionarioCollection();
        const filter: Filter<Document> = { _id: new ObjectId(idFuncionario) };
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }

    /**
     * Atualiza os dados de um funcionário.
     * A senha, se fornecida, já deve vir hash.
     * O cargoId, se fornecido, já deve ser um ObjectId válido.
     */
    async update(idFuncionario: string, updateData: any): Promise<boolean> {
        console.log(`🟢 FuncionarioDAO.update(${idFuncionario})`);
        const collection = await this.getFuncionarioCollection();
        const filter: Filter<Document> = { _id: new ObjectId(idFuncionario) };

        // Remove campos undefined para não sobrescrever com vazio
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const update: UpdateFilter<Document> = { $set: updateData };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    /**
     * Converte um documento do MongoDB (com cargo populado) em instância de Funcionario.
     */
    private toFuncionario(doc: any): Funcionario {
        const cargo = new Cargo();
        cargo.idCargo = doc.cargo.idCargo.toHexString ? doc.cargo.idCargo.toHexString() : doc.cargo.idCargo;
        cargo.nomeCargo = doc.cargo.nomeCargo;

        const funcionario = new Funcionario();
        funcionario.idFuncionario = doc.idFuncionario.toHexString ? doc.idFuncionario.toHexString() : doc.idFuncionario;
        funcionario.nomeFuncionario = doc.nomeFuncionario;
        funcionario.email = doc.email;
        funcionario.recebeValeTransporte = doc.recebeValeTransporte;
        funcionario.cargo = cargo;
        return funcionario;
    }

    async findAll(): Promise<Funcionario[]> {
        console.log("🟢 FuncionarioDAO.findAll()");
        const collection = await this.getFuncionarioCollection();
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
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const resultado = await cursor.toArray();
        return resultado.map(doc => this.toFuncionario(doc));
    }

    async findById(idFuncionario: string): Promise<Funcionario | null> {
        console.log(`🟢 FuncionarioDAO.findById(${idFuncionario})`);
        const collection = await this.getFuncionarioCollection();
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
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const resultado = await cursor.toArray();
        if (resultado.length === 0) return null;
        return this.toFuncionario(resultado[0]);
    }

    async findByField(field: string, value: any): Promise<Funcionario[]> {
        console.log(`🟢 FuncionarioDAO.findByField(${field}=${value})`);
        const allowedFields = ["_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId"];
        if (!allowedFields.includes(field)) {
            throw new Error("Campo inválido para busca");
        }

        const collection = await this.getFuncionarioCollection();
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
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const resultado = await cursor.toArray();
        return resultado.map(doc => this.toFuncionario(doc));
    }

    /**
     * Busca um funcionário pelo email, retornando o documento bruto (com senha) para validação.
     * Usado exclusivamente no login.
     */
    async findRawByEmail(email: string): Promise<any | null> {
        console.log(`🟢 FuncionarioDAO.findRawByEmail(${email})`);
        const collection = await this.getFuncionarioCollection();
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
                    senha: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const resultado = await cursor.toArray();
        return resultado.length === 1 ? resultado[0] : null;
    }
}