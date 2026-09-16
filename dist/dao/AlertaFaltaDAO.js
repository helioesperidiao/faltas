"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertaFaltaDAO = void 0;
class AlertaFaltaDAO {
    database;
    constructor(database) {
        this.database = database;
    }
    async collection() {
        return (await this.database.getDb()).collection("alertasFaltas");
    }
    async sincronizar(ano, bimestre, alertas, funcionario) {
        const collection = await this.collection();
        await collection.updateMany({ ano, bimestre, ativo: true }, { $set: { ativo: false, atualizadoEm: new Date(), "auditoria.alteradoPor": funcionario.idFuncionario } });
        if (alertas.length === 0)
            return;
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
exports.AlertaFaltaDAO = AlertaFaltaDAO;
//# sourceMappingURL=AlertaFaltaDAO.js.map