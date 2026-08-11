import { Request, Response } from "express";
import { DispensaService } from "../services/DispensaService";
import { Dispensa } from "@/models/Dispensa";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";

export class DispensaController extends BaseController {
    private _dispensaService: DispensaService;

    //construtor
    constructor(dispensaServiceDependency: DispensaService) {
        super();
        console.log("⬆️  DispensaController.constructor()");
        this._dispensaService = dispensaServiceDependency;
    }

    //create
    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 DispensaController.create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const novaDispensa = new Dispensa();
        novaDispensa.idAluno = request.body.dispensa.idAluno;
        novaDispensa.turma = request.body.dispensa.turma;
        novaDispensa.horaInicio = request.body.dispensa.horaInicio;
        novaDispensa.horaFim = request.body.dispensa.horaFim;
        novaDispensa.dia = new Date(request.body.dispensa.dia);;
        novaDispensa.cod = request.body.dispensa.cod;
        novaDispensa.disciplina = request.body.dispensa.disciplina;
        novaDispensa.motivo = request.body.dispensa.motivo;
        if (request.body.dispensa.nomeArquivo) {
            novaDispensa.nomeArquivo = request.body.dispensa.nomeArquivo;
        }

        const resultado = await this._dispensaService.create(novaDispensa, funcionarioLogado);

        if (!resultado) {
            StandardResponse.error("Falha ao cadastrar nova Dispensa", null, 500).send(response);
            return;
        }

        StandardResponse.created("Dispensa cadastrada com sucesso", {
            dispensas: [novaDispensa]
        }).send(response);
    };

    //uploadArquivo
    public uploadArquivo = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 DispensaController.uploadArquivo()");

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
            StandardResponse.error("Falha ao salvar referência do arquivo", null, 500).send(response);
        }
    };

    //findAll
    public findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 DispensaController.findAll()");

        const arrayDispensas = await this._dispensaService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            dispensas: arrayDispensas
        }).send(response);
    };

    //findAllDeleted
    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 DispensaController.findAllDeleted()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const dispensasDeletadas = await this._dispensaService.findAllDeleted(funcionarioLogado);

        StandardResponse.success("Busca de dispensas deletadas realizada com sucesso", {
            dispensas: dispensasDeletadas
        }).send(response);
    };

    //findById
    public findById = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 DispensaController.findById()");

        const dispensaId = _request.params.idDispensa.toString();
        const dispensa = await this._dispensaService.findById(dispensaId);

        StandardResponse.success("Executado com sucesso", {
            dispensas: dispensa
        }).send(response);
    };

    //update
    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 DispensaController.update()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const dispensaId = request.params.idDispensa.toString();

        const dispensa = new Dispensa();
        dispensa.idDispensa = dispensaId;
        dispensa.turma = request.body.dispensa.turma;
        dispensa.horaInicio = request.body.dispensa.horaInicio;
        dispensa.horaFim = request.body.dispensa.horaFim;
        dispensa.dia = request.body.dispensa.dia;
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
        console.log("🔵 DispensaController.delete()");

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
        console.log("🔵 DispensaController.count()");

        const total = await this._dispensaService.count();

        StandardResponse.success("Total de dispensas obtido", { total }).send(response);
    };
}