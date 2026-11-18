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

    /**
     * Deixa a tabela de alertas igual à situação calculada do bimestre, gravando só o que
     * mudou: alerta novo ou com dados diferentes é gravado; alerta que deixou de existir
     * fica inativo; alerta igual ao já gravado não é tocado. Assim `atualizadoEm` marca a
     * última mudança do alerta, e abrir o painel não regrava milhares de documentos.
     */
    public async sincronizar(ano: number, bimestre: number, alertas: DadosAlertaFalta[], funcionario: Funcionario): Promise<void> {
        log.debug("sincronizar()", { ano, bimestre, total: alertas.length });
        const collection = await this.collection();
        const chave = (alerta: Document | DadosAlertaFalta): string =>
            `${alerta.matricula}\u0000${alerta.turma}\u0000${alerta.codDisciplina}`;

        // O primeiro documento de cada chave é o que o updateOne abaixo atualiza; cópias
        // antigas da mesma chave (de consultas simultâneas) só ficam inativas.
        const gravados = new Map<string, Document>();
        const desativar: unknown[] = [];
        for (const doc of await collection.find({ ano, bimestre }).toArray()) {
            const k = chave(doc);
            if (gravados.has(k)) {
                if (doc.ativo) desativar.push(doc._id);
            } else {
                gravados.set(k, doc);
            }
        }
        const calculados = new Set(alertas.map(chave));
        gravados.forEach((doc, k) => {
            if (doc.ativo && !calculados.has(k)) desativar.push(doc._id);
        });
        const camposComparados: (keyof DadosAlertaFalta)[] = ["alunoNome", "disciplina", "totalFaltas", "cargaHorariaSemanalMinutos", "limiteFaltas"];
        const mudaram = alertas.filter(alerta => {
            const doc = gravados.get(chave(alerta));
            return !doc || doc.ativo !== true || camposComparados.some(campo => doc[campo] !== alerta[campo]);
        });

        if (desativar.length === 0 && mudaram.length === 0) {
            log.debug("alertas já sincronizados", { ano, bimestre, total: alertas.length });
            return;
        }
        if (desativar.length > 0) {
            await collection.updateMany(
                { _id: { $in: desativar as never[] } },
                { $set: { ativo: false, atualizadoEm: new Date(), "auditoria.alteradoPor": funcionario.idFuncionario } }
            );
            log.debug("alertas antigos desativados", { ano, bimestre, total: desativar.length });
        }
        if (mudaram.length === 0) {
            log.info("alertas sincronizados", { ano, bimestre, desativados: desativar.length, gravados: 0 });
            return;
        }
        const resultado = await collection.bulkWrite(mudaram.map(alerta => ({
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
            desativados: desativar.length,
            novos: resultado.upsertedCount,
            atualizados: resultado.modifiedCount,
        });
    }
}