"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracaoAlertaFaltaService = void 0;
const ErrorResponse_1 = require("@/http/ErrorResponse");
class ConfiguracaoAlertaFaltaService {
    dao;
    constructor(dao) {
        this.dao = dao;
    }
    validarAcesso(funcionario) {
        if (funcionario.cargo.nomeCargo !== "Processo Pedagógico") {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: "Apenas Processo Pedagógico pode administrar alertas de faltas." });
        }
    }
    validarValores(carga, limite) {
        if (!Number.isInteger(carga) || carga <= 0 || !Number.isInteger(limite) || limite <= 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Informe minutos semanais e limite de faltas como números inteiros positivos.");
        }
    }
    async findAll(funcionario) {
        this.validarAcesso(funcionario);
        return this.dao.findAll();
    }
    async create(carga, limite, funcionario) {
        this.validarAcesso(funcionario);
        this.validarValores(carga, limite);
        if ((await this.dao.findAll()).some(configuracao => configuracao.cargaHorariaSemanalMinutos === carga)) {
            throw new ErrorResponse_1.ErrorResponse(400, "Já existe uma regra para essa carga semanal.");
        }
        return this.dao.create(carga, limite, funcionario);
    }
    async update(id, carga, limite, funcionario) {
        this.validarAcesso(funcionario);
        this.validarValores(carga, limite);
        if ((await this.dao.findAll()).some(configuracao => configuracao.idConfiguracao !== id && configuracao.cargaHorariaSemanalMinutos === carga)) {
            throw new ErrorResponse_1.ErrorResponse(400, "Já existe uma regra para essa carga semanal.");
        }
        return this.dao.update(id, carga, limite, funcionario);
    }
    async delete(id, funcionario) {
        this.validarAcesso(funcionario);
        return this.dao.delete(id, funcionario);
    }
}
exports.ConfiguracaoAlertaFaltaService = ConfiguracaoAlertaFaltaService;
//# sourceMappingURL=ConfiguracaoAlertaFaltaService.js.map