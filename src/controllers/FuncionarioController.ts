import { Request, Response } from "express";
import { FuncionarioService } from "../services/FuncionarioService";
import { Funcionario } from "@/models/Funcionario";
import { StandardResponse } from "@/http/StandardResponse";
import { Cargo } from "@/models/Cargo";
import { BaseController } from "./BaseController";

/**
 * Controlador responsável pelos endpoints da entidade Funcionario.
 * 
 * Gerencia operações CRUD, autenticação (login) e contagens de funcionários,
 * utilizando injeção de dependência do FuncionarioService.
 * Todas as ações protegidas requerem um funcionário logado, obtido via BaseController.
 * 
 * @extends BaseController - Herda o método `getFuncionarioLogado()`.
 */
export class FuncionarioController extends BaseController { 
    private _funcionarioService: FuncionarioService;

    /**
     * Construtor do FuncionarioController.
     * 
     * @param funcionarioServiceDependency - Instância do serviço de Funcionario injetada.
     */
    constructor(funcionarioServiceDependency: FuncionarioService) {
        super();
        console.log("⬆️  FuncionarioController.constructor()");
        this._funcionarioService = funcionarioServiceDependency;
    }

    /**
     * Autentica um funcionário por email e senha.
     * 
     * 🔹 Rota pública (não requer autenticação JWT).
     * 
     * @route POST /api/v1/funcionarios/login
     * @param request - Requisição contendo `{ funcionario: { email: string, senha: string } }`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com dados do funcionário e token JWT.
     */
    public login = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.login()");

        const funcionario = new Funcionario();
        funcionario.email = request.body.funcionario.email;
        funcionario.senha = request.body.funcionario.senha;

        const resultado = await this._funcionarioService.loginFuncionario(funcionario);

        StandardResponse.success("Login efetuado com sucesso!", resultado).send(response);
    };

    /**
     * Cria um novo funcionário.
     * 
     * 🔹 Requer autenticação JWT.
     * 🔹 A criação valida os dois cargos aceitos no Service.
     * 
     * @route POST /api/v1/funcionarios
     * @param request - Requisição contendo `{ funcionario: { nomeFuncionario, email, senha, recebeValeTransporte, cargo: { idCargo } } }`.
     * @param response - Resposta HTTP.
     * @returns 201 Created com os dados do funcionário criado.
     */
    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.create()");

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const funcionario = new Funcionario();
        funcionario.nomeFuncionario = request.body.funcionario.nomeFuncionario;

        // Criação do cargo separadamente antes de atribuir ao funcionário
        const cargo = new Cargo();
        cargo.idCargo = request.body.funcionario.cargo.idCargo.toString();
        funcionario.cargo = cargo;

        funcionario.email = request.body.funcionario.email;
        funcionario.recebeValeTransporte = request.body.funcionario.recebeValeTransporte;
        funcionario.senha = request.body.funcionario.senha;

        const resultado = await this._funcionarioService.create(funcionario, funcionarioLogado);

        StandardResponse.created("Cadastro realizado com sucesso", { funcionario: resultado }).send(response);
    };

    /**
     * Lista todos os funcionários cadastrados.
     * 
     * 🔹 Requer autenticação JWT.
     * 
     * @route GET /api/v1/funcionarios
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com array de funcionários.
     */
    public findAll = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.findAll()");

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const listaFuncionarios = await this._funcionarioService.findAll(funcionarioLogado);

        StandardResponse.success("Executado com sucesso", { funcionarios: listaFuncionarios }).send(response);
    };

    /**
     * Busca um funcionário pelo ID.
     * 
     * 🔹 Requer autenticação JWT.
     * 
     * @route GET /api/v1/funcionarios/:idFuncionario
     * @param request - Requisição com parâmetro `idFuncionario`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados do funcionário encontrado.
     */
    public findById = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.findById()");

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = await this._funcionarioService.findById(idFuncionario, funcionarioLogado);

        StandardResponse.success("Executado com sucesso", funcionario).send(response);
    };

    /**
     * Atualiza os dados de um funcionário existente.
     * 
     * 🔹 Requer autenticação JWT.
     * 
     * @route PUT /api/v1/funcionarios/:idFuncionario
     * @param request - Requisição com parâmetro `idFuncionario` e corpo `{ funcionario: { nomeFuncionario, email, senha, recebeValeTransporte, cargo: { idCargo } } }`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados atualizados.
     */
    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.update()");

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const idFuncionario = request.params.idFuncionario.toString();

        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;
        funcionario.nomeFuncionario = request.body.funcionario.nomeFuncionario;

        // Criação do cargo separadamente antes de atribuir ao funcionário
        const cargo = new Cargo();
        cargo.idCargo = request.body.funcionario.cargo.idCargo;
        funcionario.cargo = cargo;

        funcionario.email = request.body.funcionario.email;
        funcionario.recebeValeTransporte = request.body.funcionario.recebeValeTransporte;
        funcionario.senha = request.body.funcionario.senha;

        await this._funcionarioService.updateFuncionario(funcionario, funcionarioLogado);

        StandardResponse.success("Atualizado com sucesso", {
            funcionario: {
                idFuncionario: idFuncionario,
                nomeFuncionario: request.body.funcionario.nomeFuncionario
            }
        }).send(response);
    };

    /**
     * Remove um funcionário pelo ID.
     * 
     * 🔹 Requer autenticação JWT.
     * 
     * @route DELETE /api/v1/funcionarios/:idFuncionario
     * @param request - Requisição com parâmetro `idFuncionario`.
     * @param response - Resposta HTTP.
     * @returns 204 No Content em caso de sucesso, ou 404 se o funcionário não for encontrado.
     */
    public delete = async (request: Request, response: Response): Promise<void> => {
        console.log(`🔵 FuncionarioController.delete(${request.params.idFuncionario})`);

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;

        const excluiu = await this._funcionarioService.deleteFuncionario(funcionario, funcionarioLogado);

        if (!excluiu) {
            StandardResponse.notFound("Funcionário não encontrado", {
                message: `Não existe funcionário com id ${idFuncionario}`
            }).send(response);
            return;
        }

        StandardResponse.noContent().send(response);
    };

    /**
     * Retorna o total de funcionários cadastrados.
     * 
     * 🔹 Requer autenticação JWT.
     * 
     * @route GET /api/v1/funcionarios/count
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com o total de funcionários.
     */
    public count = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.count()");

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const total = await this._funcionarioService.count(funcionarioLogado);

        StandardResponse.success("Total de funcionários obtido", { total }).send(response);
    };

    /**
     * Retorna o total de funcionários associados a um cargo específico.
     * 
     * 🔹 Requer autenticação JWT.
     * 
     * @route GET /api/v1/funcionarios/count/:idCargo
     * @param request - Requisição com parâmetro `idCargo`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com o total de funcionários do cargo.
     */
    public countByCargoId = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 FuncionarioController.countByCargoId()");

        const funcionarioLogado = this.getFuncionarioLogado(request);

        const cargoId = request.params.idCargo.toString();

        const total = await this._funcionarioService.countByCargoId(cargoId, funcionarioLogado);

        StandardResponse.success(`Total de funcionários com o cargo ID ${cargoId}`, { cargoId, total }).send(response);
    };
}
