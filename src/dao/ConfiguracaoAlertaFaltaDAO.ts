import { Collection, Document, ObjectId } from "mongodb";
import { MongoDatabase } from "@/database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";

export interface ConfiguracaoAlertaFalta {
    idConfiguracao: string;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}

export class ConfiguracaoAlertaFaltaDAO {
    constructor(private readonly database: MongoDatabase) {}

    private async collection(): Promise<Collection<Document>> {
        return (await this.database.getDb()).collection("configuracoesAlertasFaltas");
    }

    public async findAll(): Promise<ConfiguracaoAlertaFalta[]> {
        const docs = await (await this.collection())
            .find({ "auditoria.deletadoEm": null })
            .sort({ cargaHorariaSemanalMinutos: 1 })
            .toArray();
        return docs.map(doc => this.toConfiguracao(doc));
    }

    public async create(cargaHorariaSemanalMinutos: number, limiteFaltas: number, funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta> {
        const collection = await this.collection();
        const resultado = await collection.insertOne({
            cargaHorariaSemanalMinutos,
            limiteFaltas,
            auditoria: {
                criadoPor: funcionario.idFuncionario,
                criadoEm: new Date(),
                alteradoPor: "",
                alteradoEm: null,
                deletadoPor: "",
                deletadoEm: null
            }
        });
        return { idConfiguracao: resultado.insertedId.toString(), cargaHorariaSemanalMinutos, limiteFaltas };
    }

    public async update(idConfiguracao: string, cargaHorariaSemanalMinutos: number, limiteFaltas: number, funcionario: Funcionario): Promise<boolean> {
        const resultado = await (await this.collection()).updateOne(
            { _id: new ObjectId(idConfiguracao), "auditoria.deletadoEm": null },
            {
                $set: {
                    cargaHorariaSemanalMinutos,
                    limiteFaltas,
                    "auditoria.alteradoPor": funcionario.idFuncionario,
                    "auditoria.alteradoEm": new Date()
                }
            }
        );
        return resultado.modifiedCount > 0;
    }

    public async delete(idConfiguracao: string, funcionario: Funcionario): Promise<boolean> {
        const resultado = await (await this.collection()).updateOne(
            { _id: new ObjectId(idConfiguracao), "auditoria.deletadoEm": null },
            { $set: { "auditoria.deletadoPor": funcionario.idFuncionario, "auditoria.deletadoEm": new Date() } }
        );
        return resultado.modifiedCount > 0;
    }

    private toConfiguracao(doc: Document): ConfiguracaoAlertaFalta {
        return {
            idConfiguracao: doc._id.toString(),
            cargaHorariaSemanalMinutos: Number(doc.cargaHorariaSemanalMinutos),
            limiteFaltas: Number(doc.limiteFaltas)
        };
    }
}
