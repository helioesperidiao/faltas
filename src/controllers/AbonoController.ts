import { Request, Response } from "express";
import { AbonoService } from "../services/AbonoService";
import { Abono } from "@/models/Abono";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";

export class AbonoController extends BaseController {
    private _abonoService: AbonoService;

    constructor(abonoServiceDependency: AbonoService) {
        super();
        console.log("⬆️  AbonoController.constructor()");
        this._abonoService = abonoServiceDependency;
    }

    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const novoAbono = new Abono();
        novoAbono.matricula = request.body.abono.matricula;
        novoAbono.dataInicio = new Date(request.body.abono.dataInicio);
        novoAbono.dataFim = new Date(request.body.abono.dataFim);
        novoAbono.motivo = request.body.abono.motivo;

        const resultado = await this._abonoService.create(novoAbono, funcionarioLogado);

        StandardResponse.created("Abono cadastrado com sucesso", {
            abonos: [resultado]
        }).send(response);
    };

    //uploadArquivo: anexa o atestado (pdf/imagem) ao abono já criado
    public uploadArquivo = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.uploadArquivo()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        if (!request.file) {
            StandardResponse.error("Nenhum arquivo enviado", null, 400).send(response);
            return;
        }

        const idAbono = request.params.idAbono.toString();
        const abonoExistente = await this._abonoService.findById(idAbono);
        if (!abonoExistente) {
            StandardResponse.notFound("Abono não encontrado", {
                message: `Não existe abono com id ${idAbono}`
            }).send(response);
            return;
        }

        abonoExistente.nomeArquivo = request.file.filename;
        const atualizou = await this._abonoService.update(abonoExistente, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Arquivo enviado com sucesso", {
                abonos: [abonoExistente]
            }).send(response);
        } else {
            StandardResponse.error("Falha ao salvar referência do arquivo", null, 500).send(response);
        }
    };

    public findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.findAll()");

        const arrayAbonos = await this._abonoService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            abonos: arrayAbonos
        }).send(response);
    };

    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.findAllDeleted()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const abonosDeletados = await this._abonoService.findAllDeleted(funcionarioLogado);

        StandardResponse.success("Busca de abonos deletados realizada com sucesso", {
            abonos: abonosDeletados
        }).send(response);
    };

    public findById = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.findById()");

        const abonoId = _request.params.idAbono.toString();
        const abono = await this._abonoService.findById(abonoId);

        StandardResponse.success("Executado com sucesso", {
            abonos: abono
        }).send(response);
    };

    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.update()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const abonoId = request.params.idAbono.toString();

        const abono = new Abono();
        abono.idAbono = abonoId;
        abono.matricula = request.body.abono.matricula;
        abono.dataInicio = new Date(request.body.abono.dataInicio);
        abono.dataFim = new Date(request.body.abono.dataFim);
        abono.motivo = request.body.abono.motivo;
        abono.nomeArquivo = request.body.abono.nomeArquivo || '';
        abono.status = 'Pendente';

        const atualizou = await this._abonoService.update(abono, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                abonos: [abono]
            }).send(response);
        } else {
            StandardResponse.notFound("Abono não encontrado para atualização", {
                abonos: [abono]
            }).send(response);
        }
    };

    //aprovar: converte as faltas do período em Abonada
    public aprovar = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.aprovar()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const idAbono = request.params.idAbono.toString();

        const abono = await this._abonoService.aprovar(idAbono, funcionarioLogado);

        StandardResponse.success("Abono aprovado com sucesso", {
            abonos: [abono]
        }).send(response);
    };

    //rejeitar
    public rejeitar = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.rejeitar()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const idAbono = request.params.idAbono.toString();

        const abono = await this._abonoService.rejeitar(idAbono, funcionarioLogado);

        StandardResponse.success("Abono rejeitado com sucesso", {
            abonos: [abono]
        }).send(response);
    };

    public delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.delete()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const abono = new Abono();
        abono.idAbono = request.params.idAbono.toString();

        const excluiu = await this._abonoService.delete(abono, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Abono não encontrado para exclusão", {
                abonos: [{
                    idAbono: abono.idAbono
                }]
            }).send(response);
        }
    };

    public count = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 AbonoController.count()");

        const total = await this._abonoService.count();

        StandardResponse.success("Total de abonos obtido", { total }).send(response);
    };
}
