import { Request, Response } from "express";
import { FuncionarioService } from "../services/FuncionarioService";
import { Funcionario } from "@/models/Funcionario";
import { StandardResponse } from "@/http/StandardResponse";
import { Cargo } from "@/models/Cargo";

/**
 * Classe responsável por controlar os endpoints da API REST para a entidade Funcionario.
 * 
 * Implementa métodos de CRUD e autenticação, utilizando injeção de dependência
 * para receber a instância de FuncionarioService, desacoplando a lógica de negócio
 * da camada de controle.
 */
export class FuncionarioController {
    private _funcionarioService: FuncionarioService;

    /**
     * Construtor da classe FuncionarioControl
     * @param {FuncionarioService} funcionarioServiceDependency - Instância do FuncionarioService
     */
    constructor(funcionarioServiceDependency: FuncionarioService) {
        console.log("⬆️  FuncionarioController.constructor()");
        this._funcionarioService = funcionarioServiceDependency;
    }

    /**
     * Autentica um funcionário pelo email e senha.
     */
    login = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.login()");
        const funcionario = new Funcionario();
        funcionario.email = request.body.funcionario.email;
        funcionario.senha = request.body.funcionario.senha;

        const resultado = await this._funcionarioService.loginFuncionario(funcionario);

        StandardResponse.success("Login efetuado com sucesso!", resultado).send(response);
    };

    /**
     * Cria um novo funcionário.
     */
    create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.create()");
        const funcionario = new Funcionario();
        funcionario.nomeFuncionario = request.body.funcionario.nomeFuncionario;
        // ✅ garantir que cargo seja criado antes de atribuir
        const cargo = new Cargo();
        cargo.idCargo = request.body.funcionario.cargo.idCargo.toString();
        funcionario.cargo = cargo;
        funcionario.email = request.body.funcionario.email;
        funcionario.recebeValeTransporte = request.body.funcionario.recebeValeTransporte;
        funcionario.senha = request.body.funcionario.senha;

        const resultado = await this._funcionarioService.create(funcionario);

        StandardResponse.created("Cadastro realizado com sucesso", { funcionario: resultado }).send(response);
    };

    /**
     * Lista todos os funcionários cadastrados.
     */
    findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.findAll()");
        const listaFuncionarios = await this._funcionarioService.findAll();
        StandardResponse.success("Executado com sucesso", { funcionarios: listaFuncionarios }).send(response);
    };

    /**
     * Busca um funcionário pelo ID.
     */
    findById = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.findById()");
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = await this._funcionarioService.findById(idFuncionario);
        StandardResponse.success("Executado com sucesso", funcionario).send(response);
    };

    /**
     * Atualiza os dados de um funcionário existente.
     */
    update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.update()");

        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;
        funcionario.nomeFuncionario = request.body.funcionario.nomeFuncionario;
        // ✅ garantir que cargo seja criado antes de atribuir
        const cargo = new Cargo();
        cargo.idCargo = request.body.funcionario.cargo.idCargo;
        funcionario.cargo = cargo;
        funcionario.email = request.body.funcionario.email;
        funcionario.recebeValeTransporte = request.body.funcionario.recebeValeTransporte;
        funcionario.senha = request.body.funcionario.senha;

        await this._funcionarioService.updateFuncionario(funcionario);

        StandardResponse.success("Atualizado com sucesso", {
            funcionario: {
                idFuncionario: idFuncionario,
                nomeFuncionario: request.body.funcionario.nomeFuncionario
            }
        }).send(response);
    };

    /**
     * Remove um funcionário pelo ID.
     */
    delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.delete(" + request.params.idFuncionario.toString() + ")");
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;
        const excluiu = await this._funcionarioService.deleteFuncionario(funcionario);

        if (!excluiu) {
            StandardResponse.notFound("Funcionário não encontrado", {
                message: `Não existe funcionário com id ${idFuncionario}`
            }).send(response);
            return;
        }

        StandardResponse.noContent().send(response);
    };
}