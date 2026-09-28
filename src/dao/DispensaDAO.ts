import { Collection, ObjectId, Filter, UpdateFilter, Document, OptionalId } from "mongodb";
import { Dispensa } from "../models/Dispensa";
import { MongoDatabase } from "../database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
import { Auditoria } from "@/models/Auditoria";

export class DispensaDAO {
    private _database: MongoDatabase;

    //construtor
    constructor(dbInstance: MongoDatabase){
        console.log("⬆️ DispensaDAO.constructor()");
        this._database = dbInstance;
    }

    //pegando a tabela de dispensa
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("dispensa");
    }

    //create
    public async create(dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<Dispensa> {
    console.log("🟢 DispensDAO.create()");
    const collection = await this.getCollection();

    //quem criou
    dispensa.marcarCriadoPor(funcionarioLogado.idFuncionario);

    const doc: OptionalId<Document> = {
        idAluno: dispensa.idAluno,
        turma: dispensa.turma,
        horaInicio: dispensa.horaInicio,
        horaFim: dispensa.horaFim,
        dia: dispensa.dia,
        dataFim: dispensa.dataFim,
        cod: dispensa.cod,
        disciplina: dispensa.disciplina,
        motivo: dispensa.motivo,
        nomeArquivo: dispensa.nomeArquivo,
        auditoria: dispensa.auditoria.toJSON()
    };

    const result = await collection.insertOne(doc);
    if (!result.insertedId) {
        throw new Error("Falha ao inserir dispensa");
    }

    dispensa.idDispensa = result.insertedId.toString();
        return dispensa;
    }

    //delete
    public async delete (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean>{
        console.log("🟢 DispensDAO.delete(" + dispensa.idDispensa + ")");
        const collection = await this.getCollection();
        dispensa.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = {
            _id: new ObjectId(dispensa.idDispensa),
            "auditoria.deletadoEm": null
        };
        const update: UpdateFilter<Document> = {
            $set: {
                "auditoria.deletadoPor": dispensa.auditoria.deletadoPor,
                "auditoria.deletadoEm": dispensa.auditoria.deletadoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    //update
    public async update (dispensa: Dispensa, funcionarioLogado: Funcionario): Promise<boolean>{
        console.log("🟢 DispensaDAO.update(" + dispensa.idDispensa + ")");
        const collection = await this.getCollection();
        dispensa.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        const filter: Filter<Document> = { _id: new ObjectId(dispensa.idDispensa) };
        const update: UpdateFilter<Document> = {
            $set: {
                turma: dispensa.turma,
                horaInicio: dispensa.horaInicio,
                horaFim: dispensa.horaFim,
                dia: dispensa.dia,
                dataFim: dispensa.dataFim,
                cod: dispensa.cod,
                disciplina: dispensa.disciplina,
                motivo: dispensa.motivo,
                nomeArquivo: dispensa.nomeArquivo,
                "auditoria.alteradoPor": dispensa.auditoria.alteradoPor,
                "auditoria.alteradoEm": dispensa.auditoria.alteradoEm
            }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    //toDispensa
    private toDispensa(doc: any): Dispensa {
        const dispensa = new Dispensa();
        dispensa.idDispensa = doc._id.toHexString();
        dispensa.idAluno = doc.idAluno;
        dispensa.turma = doc.turma;
        dispensa.horaInicio = doc.horaInicio;
        dispensa.horaFim = doc.horaFim;
        dispensa.dia = new Date(doc.dia);
        dispensa.dataFim = doc.dataFim ? new Date(doc.dataFim) : new Date(doc.dia);
        dispensa.cod = doc.cod;
        dispensa.disciplina = doc.disciplina;
        dispensa.motivo = doc.motivo;
        dispensa.nomeArquivo = doc.nomeArquivo || '';
        if (doc.auditoria) {
            const auditoria = new Auditoria();
            auditoria.criadoPor = doc.auditoria.criadoPor || '';
            auditoria.criadoEm = doc.auditoria.criadoEm ? new Date(doc.auditoria.criadoEm) : new Date();
            auditoria.alteradoPor = doc.auditoria.alteradoPor || '';
            auditoria.alteradoEm = doc.auditoria.alteradoEm ? new Date(doc.auditoria.alteradoEm) : null;
            auditoria.deletadoPor = doc.auditoria.deletadoPor || '';
            auditoria.deletadoEm = doc.auditoria.deletadoEm ? new Date(doc.auditoria.deletadoEm) : null;
            dispensa.auditoria = auditoria;
        }
        return dispensa;
    }

    //"select" pelo ID
    public async findById(idDispensa: string): Promise<Dispensa | null> {
        console.log("🟢 DispensaDAO.findById()");
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            _id: new ObjectId(idDispensa),
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toDispensa(doc) : null;
    }

    //"select" todas
    public async findAll(): Promise<Dispensa[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": null })
        const docs = await cursor.toArray();
        return docs.map(doc => this.toDispensa(doc));
    }

    //"select" deletadas
    public async findAllDeleted(): Promise<Dispensa[]> {
        const collection = await this.getCollection();
        const cursor = collection.find({ "auditoria.deletadoEm": { $ne: null } }); //esse $ne é not equal, entao é o oposto da condição do findAll
        const docs = await cursor.toArray();
        return docs.map(doc => this.toDispensa(doc));
    }

    //count
    public async count(): Promise<number> {
        console.log("🟢 DispensaDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments({ "auditoria.deletadoEm": null });
    }

    //se quiser buscar pelo aluno, disciplina ou código da disciplina
    public async findByField(field: string, value: any): Promise<Dispensa[]> {
        console.log(`🟢 DispensaDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "idAluno", "disciplina", "cod"];
        if (!allowedFields.includes(field)) {
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
        return docs.map(doc => this.toDispensa(doc));
    }

    //verifica se existe dispensa vigente para o aluno/disciplina numa data (usado pela chamada)
    public async findVigenteParaAluno(idAluno: string, cod: string, data: Date): Promise<Dispensa | null> {
        console.log(`🟢 DispensaDAO.findVigenteParaAluno(${idAluno}, ${cod})`);
        const collection = await this.getCollection();
        const filter: Filter<Document> = {
            idAluno,
            cod,
            dia: { $lte: data },
            dataFim: { $gte: data },
            "auditoria.deletadoEm": null
        };
        const doc = await collection.findOne(filter);
        return doc ? this.toDispensa(doc) : null;
    }
}
