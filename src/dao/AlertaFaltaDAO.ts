import { Collection, Document } from "mongodb";
import { MongoDatabase } from "@/database/MongoDatabase";
import { Funcionario } from "@/models/Funcionario";

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

export class AlertaFaltaDAO {
    constructor(private readonly database: MongoDatabase) {}

    private async collection(): Promise<Collection<Document>> {
        return (await this.database.getDb()).collection("alertasFaltas");
    }

    /** Atualiza a tabela de alertas para refletir a situação calculada do bimestre. */
    public async sincronizar(ano: number, bimestre: number, alertas: DadosAlertaFalta[], funcionario: Funcionario): Promise<void> {
        const collection = await this.collection();
        await collection.updateMany(
            { ano, bimestre, ativo: true },
            { $set: { ativo: false, atualizadoEm: new Date(), "auditoria.alteradoPor": funcionario.idFuncionario } }
        );

        if (alertas.length === 0) return;
        await collection.bulkWrite(alertas.map(alerta => ({
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
    }
}
