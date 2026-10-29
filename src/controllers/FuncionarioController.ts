import { Request, Response } from "express";
import { FuncionarioService } from "../services/FuncionarioService";
import { Funcionario } from "@/models/Funcionario";
import { StandardResponse } from "@/http/StandardResponse";
import { Cargo } from "@/models/Cargo";
import { BaseController } from "./BaseController";
import { ErrorResponse } from "../http/ErrorResponse";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioController");

/**
 * Recebe requisições HTTP de funcionários e formata suas respostas.
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
     * Recebe o serviço responsável pelas regras de negócio de funcionários.
     *
     * @param funcionarioServiceDependency - Instância do serviço de Funcionario injetada.
     */
    constructor(funcionarioServiceDependency: FuncionarioService) {
        super();
        this._funcionarioService = funcionarioServiceDependency;
    }

    /**
     * Valida as credenciais e solicita ao serviço o login e o token JWT.
     *
     * 🔹 Rota pública (não requer autenticação JWT).
     *
     * @route POST /api/v1/funcionarios/login
     * @param request - Requisição contendo `{ funcionario: { email: string, senha: string } }`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com dados do funcionário e token JWT.
     */
    public login = async (request: Request, response: Response): Promise<void> => {
        log.debug("login()");

        const dados = this.requireBody(request, "funcionario");
        if (!dados.email || !dados.senha) {
            throw new ErrorResponse(400, "email e senha são obrigatórios");
        }

        const funcionario = new Funcionario();
        funcionario.email = dados.email;
        funcionario.senha = dados.senha;

        const resultado = await this._funcionarioService.loginFuncionario(funcionario);
        StandardResponse.success("Login efetuado com sucesso!", resultado).send(response);
    };

    /**
     * Monta um funcionário a partir do JSON e solicita seu cadastro.
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
        log.debug("create()");

        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dados = this.requireBody(request, "funcionario");

        if (!dados.cargo?.idCargo) {
            throw new ErrorResponse(400, "cargo.idCargo é obrigatório");
        }
        if (!dados.senha) {
            throw new ErrorResponse(400, "senha é obrigatória");
        }

        const funcionario = new Funcionario();
        funcionario.nomeFuncionario = dados.nomeFuncionario;

        // Criação do cargo separadamente antes de atribuir ao funcionário
        const cargo = new Cargo();
        cargo.idCargo = dados.cargo.idCargo.toString();
        funcionario.cargo = cargo;

        funcionario.email = dados.email;
        funcionario.recebeValeTransporte = dados.recebeValeTransporte;
        funcionario.senha = dados.senha;

        const resultado = await this._funcionarioService.create(funcionario, funcionarioLogado);
        StandardResponse.created("Cadastro realizado com sucesso", { funcionario: resultado }).send(response);
    };

    /**
     * Lista os funcionários cadastrados.
     *
     * 🔹 Requer autenticação JWT.
     *
     * @route GET /api/v1/funcionarios
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com array de funcionários.
     */
    public findAll = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAll()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const listaFuncionarios = await this._funcionarioService.findAll(funcionarioLogado);
        StandardResponse.success("Executado com sucesso", { funcionarios: listaFuncionarios }).send(response);
    };

    /**
     * Busca um funcionário pelo identificador presente na URL.
     *
     * 🔹 Requer autenticação JWT.
     *
     * @route GET /api/v1/funcionarios/:idFuncionario
     * @param request - Requisição com parâmetro `idFuncionario`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados do funcionário encontrado.
     */
    public findById = async (request: Request, response: Response): Promise<void> => {
        log.debug("findById()", { idFuncionario: request.params.idFuncionario });
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = await this._funcionarioService.findById(idFuncionario, funcionarioLogado);
        StandardResponse.success("Executado com sucesso", funcionario).send(response);
    };

    /**
     * Atualiza os dados enviados; senha só é alterada quando foi informada.
     *
     * 🔹 Requer autenticação JWT.
     *
     * @route PUT /api/v1/funcionarios/:idFuncionario
     * @param request - Requisição com parâmetro `idFuncionario` e corpo `{ funcionario: { nomeFuncionario, email, senha, recebeValeTransporte, cargo: { idCargo } } }`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados atualizados.
     */
    public update = async (request: Request, response: Response): Promise<void> => {
        log.debug("update()", { idFuncionario: request.params.idFuncionario });

        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const dados = this.requireBody(request, "funcionario");

        if (!dados.cargo?.idCargo) {
            throw new ErrorResponse(400, "cargo.idCargo é obrigatório");
        }

        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;
        funcionario.nomeFuncionario = dados.nomeFuncionario;

        // Criação do cargo separadamente antes de atribuir ao funcionário
        const cargo = new Cargo();
        cargo.idCargo = dados.cargo.idCargo;
        funcionario.cargo = cargo;

        funcionario.email = dados.email;
        funcionario.recebeValeTransporte = dados.recebeValeTransporte;

        // Só define a senha se foi enviada (evita apagar a senha atual)
        if (dados.senha !== undefined && dados.senha !== null && dados.senha !== "") {
            funcionario.senha = dados.senha;
        }

        const atualizou = await this._funcionarioService.updateFuncionario(funcionario, funcionarioLogado);

        if (!atualizou) {
            StandardResponse.notFound("Funcionário não encontrado para atualização", {
                funcionario: { idFuncionario }
            }).send(response);
            return;
        }

        StandardResponse.success("Atualizado com sucesso", {
            funcionario: {
                idFuncionario,
                nomeFuncionario: dados.nomeFuncionario
            }
        }).send(response);
    };

    /**
     * Remove o funcionário identificado na URL.
     *
     * 🔹 Requer autenticação JWT.
     *
     * @route DELETE /api/v1/funcionarios/:idFuncionario
     * @param request - Requisição com parâmetro `idFuncionario`.
     * @param response - Resposta HTTP.
     * @returns 204 No Content em caso de sucesso, ou 404 se o funcionário não for encontrado.
     */
    public delete = async (request: Request, response: Response): Promise<void> => {
        log.debug("delete()", { idFuncionario: request.params.idFuncionario });

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
     * Retorna a quantidade total de funcionários cadastrados.
     *
     * 🔹 Requer autenticação JWT.
     *
     * @route GET /api/v1/funcionarios/count
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com o total de funcionários.
     */
    public count = async (request: Request, response: Response): Promise<void> => {
        log.debug("count()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const total = await this._funcionarioService.count(funcionarioLogado);
        StandardResponse.success("Total de funcionários obtido", { total }).send(response);
    };

    /**
     * Conta os funcionários associados ao cargo indicado na URL.
     *
     * 🔹 Requer autenticação JWT.
     *
     * @route GET /api/v1/funcionarios/count/:idCargo
     * @param request - Requisição com parâmetro `idCargo`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com o total de funcionários do cargo.
     */
    public countByCargoId = async (request: Request, response: Response): Promise<void> => {
        log.debug("countByCargoId()", { idCargo: request.params.idCargo });
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const total = await this._funcionarioService.countByCargoId(cargoId, funcionarioLogado);
        StandardResponse.success(`Total de funcionários com o cargo ID ${cargoId}`, { cargoId, total }).send(response);
    };
}