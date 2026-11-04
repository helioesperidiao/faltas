import { Collection, Document } from "mongodb";
import { MongoDatabase } from "@/database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("AlertaFaltaDAO");

export interface DadosAlertaFalta {
    matricula: string;
    alunoNome: string;
    turma: string;
    codDisciplina: string;
    disciplina: string;
    totalFaltas: number;
    cargaHorariaSemanalMinutos: number;
    limiteFaltas: number;
}

/**
 * Executa sincronização da coleção de alertas de falta por bimestre.
 */
export class AlertaFaltaDAO {
    constructor(private readonly database: MongoDatabase) {}

    private async collection(): Promise<Collection<Document>> {
        return (await this.database.getDb()).collection("alertasFaltas");
    }

    /** Atualiza a tabela de alertas para refletir a situação calculada do bimestre. */
    public async sincronizar(ano: number, bimestre: number, alertas: DadosAlertaFalta[], funcionario: Funcionario): Promise<void> {
        log.debug("sincronizar()", { ano, bimestre, total: alertas.length });
        const collection = await this.collection();
        const desativados = await collection.updateMany(
            { ano, bimestre, ativo: true },
            { $set: { ativo: false, atualizadoEm: new Date(), "auditoria.alteradoPor": funcionario.idFuncionario } }
        );
        if (desativados.modifiedCount > 0) {
            log.debug("alertas antigos desativados", { ano, bimestre, total: desativados.modifiedCount });
        }

        if (alertas.length === 0) {
            log.info("sincronização concluída sem novos alertas", { ano, bimestre });
            return;
        }
        const resultado = await collection.bulkWrite(alertas.map(alerta => ({
            updateOne: {
                filter: {
                    ano,
                    bimestre,
                    matricula: alerta.matricula,
                    turma: alerta.turma,
                    codDisciplina: alerta.codDisciplina
                },
                update: {
                    $set: { ...alerta, ano, bimestre, ativo: true, atualizadoEm: new Date(), "auditoria.alteradoPor": funcionario.idFuncionario },
                    $setOnInsert: {
                        "auditoria.criadoPor": funcionario.idFuncionario,
                        "auditoria.criadoEm": new Date(),
                        "auditoria.deletadoPor": "",
                        "auditoria.deletadoEm": null
                    }
                },
                upsert: true
            }
        })));
        log.info("alertas sincronizados", {
            ano,
            bimestre,
            novos: resultado.upsertedCount,
            atualizados: resultado.modifiedCount,
        });
    }
}