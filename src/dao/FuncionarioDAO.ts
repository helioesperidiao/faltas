import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Funcionario } from "../models/Funcionario";
import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";

/**
 * Data Access Object para a entidade Funcionario.
 * 
 * Responsável por todas as operações de banco de dados relacionadas a funcionários,
 * incluindo CRUD, busca por campos específicos, autenticação (email) e contagens.
 * Utiliza injeção de dependência do MongoDatabase para obter a conexão com o MongoDB.
 * 
 * @example
 * const db = new MongoDatabase();
 * const funcionarioDAO = new FuncionarioDAO(db);
 * const funcionarios = await funcionarioDAO.findAll();
 */
export class FuncionarioDAO {
    private _database: MongoDatabase;

    /**
     * Construtor do FuncionarioDAO.
     * @param dbInstance - Instância do MongoDatabase para acesso ao banco.
     */
    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ FuncionarioDAO.constructor()");
        this._database = dbInstance;
    }

    /**
     * Obtém a coleção "funcionario" do MongoDB.
     * @returns Promise com a Collection.
     */
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("funcionario");
    }

    // ======================== MÉTODOS CRUD ========================

    /**
     * Insere um novo funcionário no banco de dados.
     * 
     * A senha deve ser previamente hashada e atribuída ao campo privado `_senha`.
     * O ID do cargo é convertido para ObjectId.
     * 
     * @param objFuncionarioModel - Instância de Funcionario com os dados a serem inseridos.
     * @returns O mesmo objeto Funcionario com o `idFuncionario` preenchido.
     * @throws {Error} Se o cargo não estiver informado ou se a inserção falhar.
     * 
     * @example
     * const funcionario = new Funcionario();
     * funcionario.nomeFuncionario = "João";
     * (funcionario as any)._senha = hash;
     * const criado = await funcionarioDAO.create(funcionario);
     */
    public async create(objFuncionarioModel: Funcionario): Promise<Funcionario> {
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

    /**
     * Remove um funcionário do banco de dados pelo ID.
     * 
     * @param objFuncionarioModel - Instância de Funcionario contendo o `idFuncionario`.
     * @returns `true` se o documento foi deletado, `false` caso contrário.
     * 
     * @example
     * const funcionario = new Funcionario();
     * funcionario.idFuncionario = "67a1b2c3d4e5f6789a0b1c2d";
     * const deletado = await funcionarioDAO.delete(funcionario);
     */
    public async delete(objFuncionarioModel: Funcionario): Promise<boolean> {
        console.log(`🟢 FuncionarioDAO.delete(${objFuncionarioModel.idFuncionario})`);
        const collection = await this.getCollection();
        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }

    /**
     * Atualiza os dados de um funcionário existente.
     * 
     * Apenas os campos fornecidos na instância são atualizados.
     * Se `cargo.idCargo` for informado, a referência é atualizada.
     * Se uma nova senha for fornecida (já hashada em `_senha`), ela é atualizada.
     * 
     * @param objFuncionarioModel - Instância de Funcionario com os dados atualizados (deve conter `idFuncionario`).
     * @returns `true` se o documento foi atualizado, `false` caso contrário.
     * 
     * @example
     * const funcionario = new Funcionario();
     * funcionario.idFuncionario = "67a1b2c3d4e5f6789a0b1c2d";
     * funcionario.nomeFuncionario = "João Silva";
     * const atualizado = await funcionarioDAO.update(funcionario);
     */
    public async update(objFuncionarioModel: Funcionario): Promise<boolean> {
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

    // ======================== MÉTODOS DE CONSULTA ========================

    /**
     * Retorna todos os funcionários cadastrados, com os dados do cargo populados via `$lookup`.
     * 
     * @returns Lista de instâncias de Funcionario.
     * 
     * @example
     * const todos = await funcionarioDAO.findAll();
     * console.log(todos[0].cargo.nomeCargo);
     */
    public async findAll(): Promise<Funcionario[]> {
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
        const docs = await cursor.toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }

    /**
     * Busca um funcionário pelo ID, com os dados do cargo populados via `$lookup`.
     * 
     * @param idFuncionario - ID do funcionário (string hexadecimal).
     * @returns O funcionário encontrado ou `null` se não existir.
     * 
     * @example
     * const funcionario = await funcionarioDAO.findById("67a1b2c3d4e5f6789a0b1c2d");
     */
    public async findById(idFuncionario: string): Promise<Funcionario | null> {
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
        const docs = await cursor.toArray();
        if (docs.length === 0) return null;
        return this.toFuncionario(docs[0]);
    }

    /**
     * Busca funcionários por um campo específico, com os dados do cargo populados via `$lookup`.
     * 
     * @param field - Nome do campo (permitidos: "_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId").
     * @param value - Valor a ser buscado.
     * @returns Lista de funcionários que correspondem ao filtro.
     * @throws {Error} Se o campo não for permitido.
     * 
     * @example
     * const admins = await funcionarioDAO.findByField("cargoId", "67a1b2c3d4e5f6789a0b1c2d");
     */
    public async findByField(field: string, value: any): Promise<Funcionario[]> {
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
        const docs = await cursor.toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }

    /**
     * Busca um funcionário pelo email, com os dados do cargo populados via `$lookup`.
     * 
     * Especificamente usado para autenticação (login), pois inclui a senha no retorno.
     * 
     * @param email - Email do funcionário.
     * @returns O funcionário encontrado (com senha) ou `null` se não existir.
     * 
     * @example
     * const funcionario = await funcionarioDAO.findByEmail("joao@empresa.com");
     */
    public async findByEmail(email: string): Promise<Funcionario | null> {
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
        const docs = await cursor.toArray();

        if (docs.length === 0) {
            return null;
        }

        return this.toFuncionario(docs[0]);
    }

    // ======================== MÉTODOS DE CONTAGEM ========================

    /**
     * Retorna o número total de funcionários cadastrados.
     * 
     * @returns Total de funcionários.
     * 
     * @example
     * const total = await funcionarioDAO.count();
     */
    public async count(): Promise<number> {
        console.log("🟢 FuncionarioDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments();
    }

    /**
     * Conta quantos funcionários possuem um determinado cargo (pelo ID do cargo).
     * 
     * Utiliza `countDocuments` com filtro no `cargoId` (recomenda-se índice para performance).
     * 
     * @param cargoId - ID do cargo (string hexadecimal).
     * @returns Total de funcionários com esse cargo.
     * 
     * @example
     * const totalAdmin = await funcionarioDAO.countByCargoId("67a1b2c3d4e5f6789a0b1c2d");
     */
    public async countByCargoId(cargoId: string): Promise<number> {
        console.log(`🟢 FuncionarioDAO.countByCargoId(${cargoId})`);
        const collection = await this.getCollection();
        return await collection.countDocuments({ cargoId: new ObjectId(cargoId) });
    }

    // ======================== MÉTODOS AUXILIARES ========================

    /**
     * Converte um documento MongoDB em uma instância de Funcionario.
     * 
     * A senha é atribuída diretamente ao campo privado `_senha` para evitar
     * a validação do setter, que pode não permitir o hash do bcrypt.
     * 
     * @param doc - Documento do MongoDB (deve conter os campos: idFuncionario, nomeFuncionario, email, senha, recebeValeTransporte, cargo).
     * @returns Instância de Funcionario.
     * @private
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