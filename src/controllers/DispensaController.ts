import { Request, Response } from "express";
import { DispensaService } from "../services/DispensaService";
import { Dispensa } from "@/models/Dispensa";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("DispensaController");

/**
 * Traduz requisições HTTP de dispensas em chamadas ao DispensaService.
 *
 * Fluxo típico:
 * 1. POST /                 — cria a dispensa
 * 2. POST /:id/arquivo      — anexa o atestado (jpg/pdf)
 */
export class DispensaController extends BaseController {
    private _dispensaService: DispensaService;

    //construtor
    constructor(dispensaServiceDependency: DispensaService) {
        super();
        this._dispensaService = dispensaServiceDependency;
    }

    //create
    public create = async (request: Request, response: Response): Promise<void> => {
        log.debug("create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const novaDispensa = new Dispensa();
        novaDispensa.idAluno = request.body.dispensa.idAluno;
        novaDispensa.turma = request.body.dispensa.turma;
        novaDispensa.horaInicio = request.body.dispensa.horaInicio;
        novaDispensa.horaFim = request.body.dispensa.horaFim;
        novaDispensa.dia = new Date(request.body.dispensa.dia);;
        novaDispensa.dataFim = request.body.dispensa.dataFim ? new Date(request.body.dispensa.dataFim) : novaDispensa.dia;
        novaDispensa.cod = request.body.dispensa.cod;
        novaDispensa.disciplina = request.body.dispensa.disciplina;
        novaDispensa.motivo = request.body.dispensa.motivo;
        if (request.body.dispensa.nomeArquivo) {
            novaDispensa.nomeArquivo = request.body.dispensa.nomeArquivo;
        }

        const resultado = await this._dispensaService.create(novaDispensa, funcionarioLogado);

        if (!resultado) {
            log.error("falha ao cadastrar nova dispensa", {
                idAluno: novaDispensa.idAluno,
                turma: novaDispensa.turma,
            });
            StandardResponse.error("Falha ao cadastrar nova Dispensa", null, 500).send(response);
            return;
        }

        StandardResponse.created("Dispensa cadastrada com sucesso", {
            dispensas: [novaDispensa]
        }).send(response);
    };

    //uploadArquivo
    public uploadArquivo = async (request: Request, response: Response): Promise<void> => {
        log.debug("uploadArquivo()", { idDispensa: request.params.idDispensa });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        if (!request.file) {
            StandardResponse.error("Nenhum arquivo enviado", null, 400).send(response);
            return;
        }

        const idDispensa = request.params.idDispensa.toString();

        const dispensaExistente = await this._dispensaService.findById(idDispensa);
        if (!dispensaExistente) {
            StandardResponse.notFound("Dispensa não encontrada", {
                message: `Não existe dispensa com id ${idDispensa}`
            }).send(response);
            return;
        }

        dispensaExistente.nomeArquivo = request.file.filename;

        const atualizou = await this._dispensaService.update(dispensaExistente, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Arquivo enviado com sucesso", {
                dispensas: [dispensaExistente]
            }).send(response);
        } else {
            log.error("falha ao salvar referência do arquivo da dispensa", {
                idDispensa,
                nomeArquivo: request.file.filename,
            });
            StandardResponse.error("Falha ao salvar referência do arquivo", null, 500).send(response);
        }
    };

    //findAll
    public findAll = async (_request: Request, response: Response): Promise<void> => {
        log.debug("findAll()");

        const arrayDispensas = await this._dispensaService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            dispensas: arrayDispensas
        }).send(response);
    };

    //findAllDeleted
    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAllDeleted()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const dispensasDeletadas = await this._dispensaService.findAllDeleted(funcionarioLogado);

        StandardResponse.success("Busca de dispensas deletadas realizada com sucesso", {
            dispensas: dispensasDeletadas
        }).send(response);
    };

    //findById
    public findById = async (request: Request, response: Response): Promise<void> => {
        log.debug("findById()", { idDispensa: request.params.idDispensa });

        const dispensaId = request.params.idDispensa.toString();
        const dispensa = await this._dispensaService.findById(dispensaId);

        StandardResponse.success("Executado com sucesso", {
            dispensas: dispensa
        }).send(response);
    };

    //update
    public update = async (request: Request, response: Response): Promise<void> => {
        log.debug("update()", { idDispensa: request.params.idDispensa });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const dispensaId = request.params.idDispensa.toString();

        const dispensa = new Dispensa();
        dispensa.idDispensa = dispensaId;
        dispensa.turma = request.body.dispensa.turma;
        dispensa.horaInicio = request.body.dispensa.horaInicio;
        dispensa.horaFim = request.body.dispensa.horaFim;
        dispensa.dia = request.body.dispensa.dia;
        dispensa.dataFim = request.body.dispensa.dataFim ? new Date(request.body.dispensa.dataFim) : new Date(request.body.dispensa.dia);
        dispensa.cod = request.body.dispensa.cod;
        dispensa.disciplina = request.body.dispensa.disciplina;
        dispensa.motivo = request.body.dispensa.motivo;
        dispensa.nomeArquivo = request.body.dispensa.nomeArquivo || '';

        const atualizou = await this._dispensaService.update(dispensa, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                dispensas: [dispensa]
            }).send(response);
        } else {
            StandardResponse.notFound("Dispensa não encontrada para atualização", {
                dispensas: [dispensa]
            }).send(response);
        }
    };

    //delete
    public delete = async (request: Request, response: Response): Promise<void> => {
        log.debug("delete()", { idDispensa: request.params.idDispensa });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const dispensa = new Dispensa();
        dispensa.idDispensa = request.params.idDispensa.toString();

        const excluiu = await this._dispensaService.delete(dispensa, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Dispensa não encontrada para exclusão", {
                dispensas: [{
                    idDispensa: dispensa.idDispensa
                }]
            }).send(response);
        }
    };

    //count
    public count = async (_request: Request, response: Response): Promise<void> => {
        log.debug("count()");

        const total = await this._dispensaService.count();

        StandardResponse.success("Total de dispensas obtido", { total }).send(response);
    };
}