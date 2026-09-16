"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracaoAlertaFaltaDAO = void 0;
const mongodb_1 = require("mongodb");
class ConfiguracaoAlertaFaltaDAO {
    database;
    constructor(database) {
        this.database = database;
    }
    async collection() {
        return (await this.database.getDb()).collection("configuracoesAlertasFaltas");
    }
    async findAll() {
        const docs = await (await this.collection())
            .find({ "auditoria.deletadoEm": null })
            .sort({ cargaHorariaSemanalMinutos: 1 })
            .toArray();
        return docs.map(doc => this.toConfiguracao(doc));
    }
    async create(cargaHorariaSemanalMinutos, limiteFaltas, funcionario) {
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
    async update(idConfiguracao, cargaHorariaSemanalMinutos, limiteFaltas, funcionario) {
        const resultado = await (await this.collection()).updateOne({ _id: new mongodb_1.ObjectId(idConfiguracao), "auditoria.deletadoEm": null }, {
            $set: {
                cargaHorariaSemanalMinutos,
                limiteFaltas,
                "auditoria.alteradoPor": funcionario.idFuncionario,
                "auditoria.alteradoEm": new Date()
            }
        });
        return resultado.modifiedCount > 0;
    }
    async delete(idConfiguracao, funcionario) {
        const resultado = await (await this.collection()).updateOne({ _id: new mongodb_1.ObjectId(idConfiguracao), "auditoria.deletadoEm": null }, { $set: { "auditoria.deletadoPor": funcionario.idFuncionario, "auditoria.deletadoEm": new Date() } });
        return resultado.modifiedCount > 0;
    }
    toConfiguracao(doc) {
        return {
            idConfiguracao: doc._id.toString(),
            cargaHorariaSemanalMinutos: Number(doc.cargaHorariaSemanalMinutos),
            limiteFaltas: Number(doc.limiteFaltas)
        };
    }
}
exports.ConfiguracaoAlertaFaltaDAO = ConfiguracaoAlertaFaltaDAO;
//# sourceMappingURL=ConfiguracaoAlertaFaltaDAO.js.map