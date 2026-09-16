"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioController = void 0;
const Funcionario_1 = require("@/models/Funcionario");
const StandardResponse_1 = require("@/http/StandardResponse");
const Cargo_1 = require("@/models/Cargo");
const BaseController_1 = require("./BaseController");
class FuncionarioController extends BaseController_1.BaseController {
    _funcionarioService;
    constructor(funcionarioServiceDependency) {
        super();
        console.log("⬆️  FuncionarioController.constructor()");
        this._funcionarioService = funcionarioServiceDependency;
    }
    login = async (request, response) => {
        console.log("🔵 FuncionarioController.login()");
        const funcionario = new Funcionario_1.Funcionario();
        funcionario.email = request.body.funcionario.email;
        funcionario.senha = request.body.funcionario.senha;
        const resultado = await this._funcionarioService.loginFuncionario(funcionario);
        StandardResponse_1.StandardResponse.success("Login efetuado com sucesso!", resultado).send(response);
    };
    create = async (request, response) => {
        console.log("🔵 FuncionarioController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const funcionario = new Funcionario_1.Funcionario();
        funcionario.nomeFuncionario = request.body.funcionario.nomeFuncionario;
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = request.body.funcionario.cargo.idCargo.toString();
        funcionario.cargo = cargo;
        funcionario.email = request.body.funcionario.email;
        funcionario.recebeValeTransporte = request.body.funcionario.recebeValeTransporte;
        funcionario.senha = request.body.funcionario.senha;
        const resultado = await this._funcionarioService.create(funcionario, funcionarioLogado);
        StandardResponse_1.StandardResponse.created("Cadastro realizado com sucesso", { funcionario: resultado }).send(response);
    };
    findAll = async (request, response) => {
        console.log("🔵 FuncionarioController.findAll()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const listaFuncionarios = await this._funcionarioService.findAll(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", { funcionarios: listaFuncionarios }).send(response);
    };
    findById = async (request, response) => {
        console.log("🔵 FuncionarioController.findById()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = await this._funcionarioService.findById(idFuncionario, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", funcionario).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 FuncionarioController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = new Funcionario_1.Funcionario();
        funcionario.idFuncionario = idFuncionario;
        funcionario.nomeFuncionario = request.body.funcionario.nomeFuncionario;
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = request.body.funcionario.cargo.idCargo;
        funcionario.cargo = cargo;
        funcionario.email = request.body.funcionario.email;
        funcionario.recebeValeTransporte = request.body.funcionario.recebeValeTransporte;
        funcionario.senha = request.body.funcionario.senha;
        await this._funcionarioService.updateFuncionario(funcionario, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
            funcionario: {
                idFuncionario: idFuncionario,
                nomeFuncionario: request.body.funcionario.nomeFuncionario
            }
        }).send(response);
    };
    delete = async (request, response) => {
        console.log(`🔵 FuncionarioController.delete(${request.params.idFuncionario})`);
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = new Funcionario_1.Funcionario();
        funcionario.idFuncionario = idFuncionario;
        const excluiu = await this._funcionarioService.deleteFuncionario(funcionario, funcionarioLogado);
        if (!excluiu) {
            StandardResponse_1.StandardResponse.notFound("Funcionário não encontrado", {
                message: `Não existe funcionário com id ${idFuncionario}`
            }).send(response);
            return;
        }
        StandardResponse_1.StandardResponse.noContent().send(response);
    };
    count = async (request, response) => {
        console.log("🔵 FuncionarioController.count()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const total = await this._funcionarioService.count(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Total de funcionários obtido", { total }).send(response);
    };
    countByCargoId = async (request, response) => {
        console.log("🔵 FuncionarioController.countByCargoId()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const total = await this._funcionarioService.countByCargoId(cargoId, funcionarioLogado);
        StandardResponse_1.StandardResponse.success(`Total de funcionários com o cargo ID ${cargoId}`, { cargoId, total }).send(response);
    };
}
exports.FuncionarioController = FuncionarioController;
//# sourceMappingURL=FuncionarioController.js.map