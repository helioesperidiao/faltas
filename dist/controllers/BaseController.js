"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const Funcionario_1 = require("@/models/Funcionario");
class BaseController {
    getFuncionarioLogado(request) {
        const funcionarioLogadoJson = request.funcionarioLogado;
        if (!funcionarioLogadoJson) {
            throw new Error("Funcionário não autenticado");
        }
        const funcionarioLogado = new Funcionario_1.Funcionario();
        funcionarioLogado.idFuncionario = funcionarioLogadoJson.idFuncionario;
        funcionarioLogado.nomeFuncionario = funcionarioLogadoJson.nomeFuncionario;
        funcionarioLogado.email = funcionarioLogadoJson.email;
        if (funcionarioLogadoJson.cargo) {
            funcionarioLogado.cargo.idCargo = funcionarioLogadoJson.cargo.idCargo;
            funcionarioLogado.cargo.nomeCargo = funcionarioLogadoJson.cargo.nomeCargo;
        }
        return funcionarioLogado;
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map