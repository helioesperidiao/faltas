import { Request, Response } from "express";
import { CargoService } from "../services/CargoService";
import { BaseController } from "./BaseController";
import { StandardResponse } from "@/http/StandardResponse";
import { Cargo } from "@/models/Cargo";
import { Funcionario } from "@/models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoController");

/**
 * Traduz requisições HTTP de cargos em chamadas aos serviços de negócio.
 *
 * @extends BaseController - Herda o método `getFuncionarioLogado()`.
 */
export class CargoController extends BaseController {
    private _cargoService: CargoService;

    /**
     * Recebe o serviço responsável pelas regras de negócio de cargos.
     *
     * @param cargoServiceDependency - Instância do serviço de Cargo injetada.
     */
    constructor(cargoServiceDependency: CargoService) {
        super();
        this._cargoService = cargoServiceDependency;
    }

    /**
     * Recebe os dados de um cargo novo e devolve a resposta de criação.
     *
     * 🔹 Ação restrita a administradores (validação no Service).
     *
     * @route POST /api/v1/cargos
     * @param request - Requisição contendo `{ cargo: { nomeCargo: string } }`.
     * @param response - Resposta HTTP.
     * @returns 201 Created com os dados do cargo criado.
     */
    public create = async (request: Request, response: Response): Promise<void> => {
        log.debug("create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const dados = this.requireBody(request, "cargo");

        if (!dados.nomeCargo) {
            throw new ErrorResponse(400, "nomeCargo é obrigatório");
        }

        const novoCargo = new Cargo();
        novoCargo.nomeCargo = dados.nomeCargo;

        const resultado = await this._cargoService.create(novoCargo, funcionarioLogado);

        if (!resultado) {
            log.error("falha ao cadastrar cargo", { nomeCargo: novoCargo.nomeCargo });
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
     * Lista os cargos disponíveis para o funcionário autenticado.
     *
     * @route GET /api/v1/cargos
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com array de cargos.
     */
    public findAll = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAll()");
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const arrayCargos = await this._cargoService.findAll(funcionarioLogado);
        StandardResponse.success("Busca realizada com sucesso", { cargos: arrayCargos }).send(response);
    };

    /**
     * Lista todos os cargos que foram deletados (soft delete).
     *
     * ⚠️ Requer que o CargoService do projeto exponha `findAllDeleted`.
     * Se o seu service ainda não tem esse método, veja a nota abaixo do código.
     *
     * @route GET /api/v1/cargos/deleted
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com array de cargos deletados.
     */
    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAllDeleted()");
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const cargosDeletados = await this._cargoService.findAllDeleted(funcionarioLogado);
        StandardResponse.success("Busca de cargos deletados realizada com sucesso", {
            cargos: cargosDeletados
        }).send(response);
    };

    /**
     * Procura um cargo pelo identificador informado na URL.
     *
     * @route GET /api/v1/cargos/:idCargo
     * @param request - Requisição com parâmetro `idCargo`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados do cargo encontrado, ou 404 se não existir.
     */
    public findById = async (request: Request, response: Response): Promise<void> => {
        log.debug("findById()", { idCargo: request.params.idCargo });
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const cargo = await this._cargoService.findById(cargoId, funcionarioLogado);

        if (!cargo) {
            StandardResponse.notFound("Cargo não encontrado", { cargos: null }).send(response);
            return;
        }

        StandardResponse.success("Executado com sucesso", { cargos: cargo }).send(response);
    };

    /**
     * Atualiza o nome de um cargo existente.
     *
     * @route PUT /api/v1/cargos/:idCargo
     * @param request - Requisição com parâmetro `idCargo` e corpo `{ cargo: { nomeCargo: string } }`.
     * @param response - Resposta HTTP.
     * @returns 200 OK com os dados atualizados ou 404 se o cargo não for encontrado.
     */
    public update = async (request: Request, response: Response): Promise<void> => {
        log.debug("update()", { idCargo: request.params.idCargo });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const dados = this.requireBody(request, "cargo");

        const cargo = new Cargo();
        cargo.idCargo = cargoId;
        cargo.nomeCargo = dados.nomeCargo;

        const atualizou = await this._cargoService.update(cargo, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                cargos: [{ idCargo: cargoId, nomeCargo: dados.nomeCargo }]
            }).send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para atualização", {
                cargos: [{ idCargo: cargoId, nomeCargo: dados.nomeCargo }]
            }).send(response);
        }
    };

    /**
     * Exclui um cargo, se as regras de negócio permitirem.
     *
     * @route DELETE /api/v1/cargos/:idCargo
     * @param request - Requisição com parâmetro `idCargo`.
     * @param response - Resposta HTTP.
     * @returns 204 No Content em caso de sucesso, ou 404 se o cargo não for encontrado.
     */
    public delete = async (request: Request, response: Response): Promise<void> => {
        log.debug("delete()", { idCargo: request.params.idCargo });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const cargo = new Cargo();
        cargo.idCargo = request.params.idCargo.toString();

        const excluiu = await this._cargoService.delete(cargo, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para exclusão", {
                cargos: [{ idCargo: cargo.idCargo }]
            }).send(response);
        }
    };

    /**
     * Retorna a quantidade total de cargos cadastrados.
     *
     * @route GET /api/v1/cargos/count
     * @param request - Requisição (sem parâmetros).
     * @param response - Resposta HTTP.
     * @returns 200 OK com o total de cargos.
     */
    public count = async (request: Request, response: Response): Promise<void> => {
        log.debug("count()");
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const total = await this._cargoService.count(funcionarioLogado);
        StandardResponse.success("Total de cargos obtido", { total }).send(response);
    };
}