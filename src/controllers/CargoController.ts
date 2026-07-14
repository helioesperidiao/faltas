import { Request, Response } from "express";
import { CargoService } from "../services/CargoService";
import { Cargo } from "@/models/Cargo";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";

/**
 * Controlador responsável pelos endpoints da entidade Cargo.
 * 
 * Gerencia as operações CRUD e contagem de cargos, garantindo que
 * todas as ações sejam registradas com o funcionário logado.
 * 
 * @extends BaseController - Herda o método `getFuncionarioLogado()`.
 */
export class CargoController extends BaseController {
    private _cargoService: CargoService;

    /**
     * Construtor do CargoController.
     * 
     * @param cargoServiceDependency - Instância do serviço de Cargo injetada.
     */
    constructor(cargoServiceDependency: CargoService) {
        super();
        console.log("⬆️  CargoController.constructor()");
        this._cargoService = cargoServiceDependency;
    }

    /**
     * Cria um novo cargo.
     * 
     * 🔹 Ação restrita a administradores (validação no Service).
     * 
     * @route POST /api/v1/cargos
     * @param request - Requisição contendo `{ cargo: { nomeCargo: string } }`.
     * @param response - Resposta HTTP.
     * @returns 201 Created com os dados do cargo criado.
     */
    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const novoCargo = new Cargo();
        novoCargo.nomeCargo = request.body.cargo.nomeCargo;

        const resultado = await this._cargoService.create(novoCargo, funcionarioLogado);

        if (!resultado) {
            StandardResponse.error("Falha ao cadastrar novo Cargo", null, 500).send(response);
            return;
        }

        StandardResponse.created("Cadastro realizado com sucesso", {
            cargos: [{
                idCargo: novoCargo.idCargo,
                nomeCargo: novoCargo.nomeCargo
            }]
        }).send(response);
    };

    /**
     * Lista todos os cargos cadastrados.
     * 
     * @route GET /api/v1/cargos
     * @param _request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com array de cargos.
     */
    public findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.findAll()");

        //const _funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const arrayCargos = await this._cargoService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            cargos: arrayCargos
        }).send(response);
    };

    /**
     * Busca um cargo pelo ID.
     * 
     * @route GET /api/v1/cargos/:idCargo
     * @param _request - Requisição com parâmetro `idCargo`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados do cargo encontrado.
     */
    public findById = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.findById()");

        //const _funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const cargoId = _request.params.idCargo.toString();
        const cargo = await this._cargoService.findById(cargoId);

        StandardResponse.success("Executado com sucesso", {
            cargos: cargo
        }).send(response);
    };

    /**
     * Atualiza um cargo existente.
     * 
     * @route PUT /api/v1/cargos/:idCargo
     * @param request - Requisição com parâmetro `idCargo` e corpo `{ cargo: { nomeCargo: string } }`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados atualizados ou 404 se o cargo não for encontrado.
     */
    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.update()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const cargoId = request.params.idCargo.toString();
        const nomeCargo = request.body.cargo.nomeCargo;

        const cargo = new Cargo();
        cargo.idCargo = cargoId;
        cargo.nomeCargo = nomeCargo;

        const atualizou = await this._cargoService.update(cargo, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                cargos: [{
                    idCargo: cargoId,
                    nomeCargo: nomeCargo
                }]
            }).send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para atualização", {
                cargos: [{
                    idCargo: cargoId,
                    nomeCargo: nomeCargo
                }]
            }).send(response);
        }
    };

    /**
     * Remove um cargo pelo ID.
     * 
     * @route DELETE /api/v1/cargos/:idCargo
     * @param request - Requisição com parâmetro `idCargo`.
     * @param response - Resposta HTTP.
     * @returns 204 No Content em caso de sucesso, ou 404 se o cargo não for encontrado.
     */
    public delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.delete()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const cargo = new Cargo();
        cargo.idCargo = request.params.idCargo.toString();

        const excluiu = await this._cargoService.delete(cargo, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para exclusão", {
                cargos: [{
                    idCargo: cargo.idCargo
                }]
            }).send(response);
        }
    };

    /**
     * Retorna a quantidade total de cargos cadastrados.
     * 
     * 🔹 Rota pública (não requer autenticação JWT).
     * 
     * @route GET /api/v1/cargos/count
     * @param _request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com o total de cargos.
     */
    public count = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 CargoController.count()");

        // Nota: esta rota é pública, o funcionário logado pode ser undefined
        //const _funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const total = await this._cargoService.count();

        StandardResponse.success("Total de cargos obtido", { total }).send(response);
    };
}