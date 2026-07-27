import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Registro } from "../models/Registro";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";


//auditoria._deletado em está sem underline, talvez dê problema
export class RegistroDAO {
    private _database: MongoDatabase;

    //construtor
    constructor(dbInstance: MongoDatabase){
        console.log("⬆️ RegistroDAO.constructor()");
        this._database = dbInstance;
    }

    //pegando a tabela de registro
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("registro");
    }


    //create
    public async create(registro: Registro, funcionarioLogado: Funcionario): Promise<Registro> {
    console.log("🟢 RegistroDAO.create()");
    const collection = await this.getCollection();

    //quem criou
    registro.marcarCriadoPor(funcionarioLogado.idFuncionario);

    const doc: OptionalId<Document> = {
        ano: registro.ano,
        codDisciplina: registro.codDisciplina,
        horaInicio: registro.horaInicio,
        horaFim: registro.horaFim,
        matricula: registro.matricula,
        falta: registro.falta,
        dia: registro.dia,
        atrasado: registro.atrasado,
        nomeAcompanhante: registro.nomeAcompanhante,
        auditoria: registro.auditoria
    };

    const result = await collection.insertOne(doc);
    if (!result.insertedId) {
        throw new Error("Falha ao inserir registro");
    }

    registro.idRegistro = result.insertedId.toString();
        return registro;
    } 
    
    //delete
    public async delete (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean>{
        console.log("🟢 RegistroDAO.delete(" + registro.idRegistro + ")");
        const collection = await this.getCollection();
        registro.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = { _id: new ObjectId(registro.idRegistro) };
        const update: UpdateFilter<Document> = {
            $set: {
                auditoria: registro.auditoria
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    //update
    public async update (registro: Registro, funcionarioLogado: Funcionario): Promise<boolean>{
        console.log("🟢 RegistroDAO.update(" + registro.idRegistro + ")");
        const collection = await this.getCollection();
        registro.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = { _id: new ObjectId(registro.idRegistro) };
        const update: UpdateFilter<Document> = {
            $set: {
                auditoria: registro.auditoria,
                falta: registro.falta,
                atrasado: registro.atrasado,
                nomeAcompanhante: registro.nomeAcompanhante
                //podemos adicionar outros campos talvez?
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    //toRegistro
    private toRegistro(doc: any): Registro {
        const registro = new Registro();
        registro.idRegistro = doc._id.toHexString();
        registro.ano = doc.ano;
        registro.codDisciplina = doc.codDisciplina;
        registro.horaInicio = doc.horaInicio;
        registro.horaFim = doc.horaFim;
        registro.matricula = doc.matricula;
        registro.falta = doc.falta;
        registro.dia = new Date(doc.dia);
        registro.atrasado = doc.atrasado;
        registro.nomeAcompanhante = doc.nomeAcompanhante || '';
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            registro.auditoria = auditoria;
        }
        return registro;
    }

    //"select" pelo ID
    public async findById(idRegistro: string): Promise<Registro | null> {
        console.log("🟢 RegistroDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idRegistro),
            "auditoria.deletadoEm": { $exists: false }
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toRegistro(doc) : null;
    }

    //"select" todos
    public async findAll(): Promise<Registro[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null })
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    //"select" deletados
    public async findAllDeleted(): Promise<Registro[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } }); //esse $ne é not equal, entao é o oposto da condição do findAll
        const docs = await cursor.toArray();
        return docs.map(doc => this.toRegistro(doc));
    }

    //count
    public async count(): Promise<number> {
        console.log("🟢 RegistroDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": { $exists: false } });
    }

    //se quiser buscar pela matricula do aluno ou pela disciplina
    public async findByField(field: string, value: any): Promise<Registro[]> {
        console.log(`🟢 RegistroDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "matricula", "codDisciplina"];
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
        return docs.map(doc => this.toRegistro(doc));
    }
}