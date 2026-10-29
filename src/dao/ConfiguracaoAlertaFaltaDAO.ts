import { Collection, Document, ObjectId } from "mongodb";
import { MongoDatabase } from "@/database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("ConfiguracaoAlertaFaltaDAO");

export interface ConfiguracaoAlertaFalta {
    idConfiguracao: string;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}

/**
 * Executa operações de persistência e consulta da coleção de configurações de alerta.
 */
export class ConfiguracaoAlertaFaltaDAO {
    constructor(private readonly database: MongoDatabase) {}

    private async collection(): Promise<Collection<Document>> {
        return (await this.database.getDb()).collection("configuracoesAlertasFaltas");
    }

    public async findAll(): Promise<ConfiguracaoAlertaFalta[]> {
        log.debug("findAll()");
        const docs = await (await this.collection())
            .find({ "auditoria.deletadoEm": null })
            .sort({ cargaHorariaSemanalMinutos: 1 })
            .toArray();
        return docs.map(doc => this.toConfiguracao(doc));
    }

    public async create(cargaHorariaSemanalMinutos: number, limiteFaltas: number, funcionario: Funcionario): Promise<ConfiguracaoAlertaFalta> {
        log.debug("create()", { cargaHorariaSemanalMinutos, limiteFaltas });
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
        log.info("configuração de alerta inserida", {
            idConfiguracao: resultado.insertedId.toString(),
            cargaHorariaSemanalMinutos,
            limiteFaltas,
        });
        return { idConfiguracao: resultado.insertedId.toString(), cargaHorariaSemanalMinutos, limiteFaltas };
    }

    public async update(idConfiguracao: string, cargaHorariaSemanalMinutos: number, limiteFaltas: number, funcionario: Funcionario): Promise<boolean> {
        log.debug("update()", { idConfiguracao, cargaHorariaSemanalMinutos, limiteFaltas });
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
        const ok = resultado.modifiedCount > 0;
        if (ok) log.info("configuração de alerta atualizada", { idConfiguracao });
        else log.warn("configuração de alerta não encontrada para atualização", { idConfiguracao });
        return ok;
    }

    public async delete(idConfiguracao: string, funcionario: Funcionario): Promise<boolean> {
        log.debug("delete()", { idConfiguracao });
        const resultado = await (await this.collection()).updateOne(
            { _id: new ObjectId(idConfiguracao), "auditoria.deletadoEm": null },
            { $set: { "auditoria.deletadoPor": funcionario.idFuncionario, "auditoria.deletadoEm": new Date() } }
        );
        const ok = resultado.modifiedCount > 0;
        if (ok) log.info("configuração de alerta removida", { idConfiguracao });
        else log.warn("configuração de alerta não encontrada para remoção", { idConfiguracao });
        return ok;
    }

    private toConfiguracao(doc: Document): ConfiguracaoAlertaFalta {
        return {
            idConfiguracao: doc._id.toString(),
            cargaHorariaSemanalMinutos: Number(doc.cargaHorariaSemanalMinutos),
            limiteFaltas: Number(doc.limiteFaltas)
        };
    }
}