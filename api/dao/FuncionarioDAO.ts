import bcrypt from "bcrypt";
import { Db, Collection, ObjectId, Filter, UpdateFilter, Document } from "mongodb";
import { Funcionario } from "../models/Funcionario";
import { Cargo } from "../models/Cargo";

/**
 * Classe responsável por gerenciar operações CRUD e autenticação
 * para a entidade Funcionario no MongoDB.
 * 
 * Utiliza injeção de dependência da instância do Db do MongoDB.
 */
export class FuncionarioDAO {
    private _funcionarioCollection: Collection<Document>;
    private _cargoCollection: Collection<Document>;

    /**
     * Construtor da classe FuncionarioDAO.
     * @param {Db} dbInstance - Instância do Db do MongoDB.
     */
    constructor(dbInstance: Db) {
        console.log("⬆️  FuncionarioDAO.constructor()");
        this._funcionarioCollection = dbInstance.collection("funcionario");
        this._cargoCollection = dbInstance.collection("cargo");
    }

    /**
     * Cria um novo funcionário no banco de dados.
     * Antes de salvar, a senha é criptografada com bcrypt.
     * 
     * @param {Funcionario} objFuncionarioModel - Objeto Funcionario a ser inserido.
     * @returns {Promise<string>} ID do funcionário inserido (string hex).
     * @throws {Error} Caso a inserção falhe.
     */
    async create(objFuncionarioModel: Funcionario): Promise<string> {
        console.log("🟢 FuncionarioDAO.create()");

        // Criptografa a senha
        const senhaHash = await bcrypt.hash(objFuncionarioModel.senha, 12);

        // Verifica se o cargo existe
        if (!objFuncionarioModel.cargo) {
            throw new Error("Cargo não informado");
        }

        // Busca o cargo pelo ID (assumindo que o ID é string hex)
        const cargoId = objFuncionarioModel.cargo.idCargo;
        const cargoFilter: Filter<Document> = { _id: new ObjectId(cargoId) };
        const cargoDoc = await this._cargoCollection.findOne(cargoFilter);
        if (!cargoDoc) {
            throw new Error("Cargo não encontrado");
        }

        const doc = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            senha: senhaHash,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
            cargoId: new ObjectId(cargoId), // referência ao cargo
        };

        const result = await this._funcionarioCollection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir funcionário");
        }

        return result.insertedId.toHexString();
    }

    /**
     * Remove um funcionário pelo ID.
     * 
     * @param {Funcionario} objFuncionarioModel - Objeto com o ID do funcionário.
     * @returns {Promise<boolean>} true se a exclusão foi bem-sucedida.
     */
    async delete(objFuncionarioModel: Funcionario): Promise<boolean> {
        console.log("🟢 FuncionarioDAO.delete()");

        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };
        const result = await this._funcionarioCollection.deleteOne(filter);

        return result.deletedCount > 0;
    }

    /**
     * Atualiza os dados de um funcionário existente.
     * Se a senha for informada, será criptografada antes da atualização.
     * 
     * @param {Funcionario} objFuncionarioModel - Objeto Funcionario com dados atualizados.
     * @returns {Promise<boolean>} true se a atualização foi bem-sucedida.
     */
    async update(objFuncionarioModel: Funcionario): Promise<boolean> {
        console.log("🟢 FuncionarioDAO.update()");

        const filter: Filter<Document> = { _id: new ObjectId(objFuncionarioModel.idFuncionario) };
        const updateData: any = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
        };

        // Se a senha for fornecida, criptografa e adiciona ao update
        if (objFuncionarioModel.senha && objFuncionarioModel.senha.trim() !== "") {
            updateData.senha = await bcrypt.hash(objFuncionarioModel.senha, 12);
        }

        // Atualiza referência do cargo se informado
        if (objFuncionarioModel.cargo) {
            const cargoId = objFuncionarioModel.cargo.idCargo;
            const cargoFilter: Filter<Document> = { _id: new ObjectId(cargoId) };
            const cargoDoc = await this._cargoCollection.findOne(cargoFilter);
            if (!cargoDoc) {
                throw new Error("Cargo não encontrado");
            }
            updateData.cargoId = new ObjectId(cargoId);
        }

        const update: UpdateFilter<Document> = { $set: updateData };
        const result = await this._funcionarioCollection.updateOne(filter, update);

        return result.modifiedCount > 0;
    }

    /**
     * Retorna todos os funcionários cadastrados no banco de dados,
     * incluindo os dados do cargo associado (via lookup).
     * 
     * @returns {Promise<Array<any>>} Lista de objetos com dados do funcionário e cargo.
     */
    async findAll(): Promise<any[]> {
        console.log("🟢 FuncionarioDAO.findAll()");

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

        const cursor = this._funcionarioCollection.aggregate(pipeline);
        const resultado = await cursor.toArray();
        return resultado;
    }

    /**
     * Busca um funcionário pelo ID.
     * 
     * @param {string} idFuncionario - ID do funcionário (string hex).
     * @returns {Promise<any|null>} Objeto com dados do funcionário e cargo, ou null.
     */
    async findById(idFuncionario: string): Promise<any | null> {
        console.log("🟢 FuncionarioDAO.findById()");

        const resultado = await this.findByField("_id", idFuncionario);
        return resultado[0] || null;
    }

    /**
     * Busca funcionários por um campo específico.
     * 
     * @param {string} field - Nome do campo. Valores permitidos: "_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId".
     * @param {*} value - Valor a ser buscado.
     * @returns {Promise<Array<any>>} Lista de funcionários encontrados com dados do cargo.
     * @throws {Error} Caso o campo informado seja inválido.
     */
    async findByField(field: string, value: any): Promise<any[]> {
        console.log(`🟢 FuncionarioDAO.findByField() - Campo: ${field}, Valor: ${value}`);

        const allowedFields = ["_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId"];
        if (!allowedFields.includes(field)) {
            throw new Error("Campo inválido para busca");
        }

        // Se for _id, converte para ObjectId
        let filter: Filter<Document> = {};
        if (field === "_id") {
            filter = { _id: new ObjectId(value) };
        } else {
            filter = { [field]: value };
        }

        // Agregação com lookup para trazer dados do cargo
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

        const cursor = this._funcionarioCollection.aggregate(pipeline);
        const resultado = await cursor.toArray();
        return resultado;
    }

    /**
     * Autentica um funcionário verificando email e senha.
     * 
     * @param {Funcionario} objFuncionarioModel - Objeto contendo email e senha.
     * @returns {Promise<Funcionario|null>} Objeto Funcionario autenticado (com cargo) ou null se falhar.
     */
    async login(objFuncionarioModel: Funcionario): Promise<Funcionario | null> {
        console.log("🟢 FuncionarioDAO.login()");

        // Busca o funcionário pelo email, incluindo os dados do cargo via lookup
        const pipeline = [
            { $match: { email: objFuncionarioModel.email } },
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

        const cursor = this._funcionarioCollection.aggregate(pipeline);
        const resultado = await cursor.toArray();

        if (resultado.length !== 1) {
            console.log("❌ Funcionário não encontrado");
            return null;
        }

        const funcionarioDB = resultado[0];

        // Verificação da senha
        const senhaValida = await bcrypt.compare(objFuncionarioModel.senha, funcionarioDB.senha);
        if (!senhaValida) {
            console.log("❌ Senha inválida");
            return null;
        }

        // Monta objeto Cargo
        const objCargo = new Cargo();
        objCargo.idCargo = funcionarioDB.cargo.idCargo.toHexString();
        objCargo.nomeCargo = funcionarioDB.cargo.nomeCargo;

        // Monta objeto Funcionario
        const funcionario = new Funcionario();
        funcionario.idFuncionario = funcionarioDB.idFuncionario.toHexString();
        funcionario.nomeFuncionario = funcionarioDB.nomeFuncionario;
        funcionario.email = funcionarioDB.email;
        funcionario.recebeValeTransporte = funcionarioDB.recebeValeTransporte;
        funcionario.cargo = objCargo;

        return funcionario;
    }
}