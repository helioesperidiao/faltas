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
        novoAbono.idRegistro = request.body.abono.idRegistro;
        novoAbono.matricula = request.body.abono.matricula;
        novoAbono.codDisciplina = request.body.abono.codDisciplina;
        novoAbono.dia = new Date(request.body.abono.dia);
        novoAbono.horasAbonadas = Number(request.body.abono.horasAbonadas);
        novoAbono.motivo = request.body.abono.motivo;

        const resultado = await this._abonoService.create(novoAbono, funcionarioLogado);

        if (!resultado) {
            StandardResponse.error("Falha ao cadastrar novo Abono", null, 500).send(response);
            return;
        }

        StandardResponse.created("Abono cadastrado com sucesso", {
            abonos: [novoAbono]
        }).send(response);
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
        abono.idRegistro = request.body.abono.idRegistro;
        abono.matricula = request.body.abono.matricula;
        abono.codDisciplina = request.body.abono.codDisciplina;
        abono.dia = new Date(request.body.abono.dia);
        abono.horasAbonadas = Number(request.body.abono.horasAbonadas);
        abono.motivo = request.body.abono.motivo;

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
