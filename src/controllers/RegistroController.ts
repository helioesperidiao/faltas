import { Request, Response } from "express";
import { RegistroService } from "../services/RegistroService";
import { Registro } from "@/models/Registro";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";
import { BaseController } from "./BaseController";

export class RegistroController extends BaseController {
    private _registroService: RegistroService;

    //construtor
    constructor(registroServiceDependency: RegistroService) {
        super();
        console.log("⬆️  RegistroController.constructor()");
        this._registroService = registroServiceDependency;
    }

    //create
    public create = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const novoRegistro = new Registro();
        novoRegistro.ano = request.body.registro.ano;
        novoRegistro.codDisciplina = request.body.registro.codDisciplina;
        novoRegistro.horaInicio = request.body.registro.horaInicio;
        novoRegistro.horaFim = request.body.registro.horaFim;
        novoRegistro.matricula = request.body.registro.matricula;
        novoRegistro.falta = request.body.registro.falta;
        novoRegistro.dia = new Date(request.body.registro.dia);
        novoRegistro.atrasado = request.body.registro.atrasado;
        if (request.body.registro.nomeAcompanhante) {
            novoRegistro.nomeAcompanhante = request.body.registro.nomeAcompanhante;
        }

        const resultado = await this._registroService.create(novoRegistro, funcionarioLogado);

        if (!resultado) {
            StandardResponse.error("Falha ao cadastrar novo Registro", null, 500).send(response);
            return;
        }

        StandardResponse.created("Registro cadastrado com sucesso", {
            registros: [novoRegistro]
        }).send(response);
    };

    //findAll
    public findAll = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.findAll()");

        const arrayRegistros = await this._registroService.findAll();

        StandardResponse.success("Busca realizada com sucesso", {
            registros: arrayRegistros
        }).send(response);
    };

    //findAllDeleted
    public findAllDeleted = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.findAllDeleted()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const registrosDeletados = await this._registroService.findAllDeleted(funcionarioLogado);

        StandardResponse.success("Busca de registros deletados realizada com sucesso", {
            registros: registrosDeletados
        }).send(response);
    };

    //findAusentesEntrada: alunos ausentes na chamada de ENTRADA para uma turma/dia
    public findAusentesEntrada = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.findAusentesEntrada()");

        const turma = request.query.turma?.toString() || '';
        const diaQuery = request.query.dia?.toString() || '';

        if (!turma || !diaQuery) {
            StandardResponse.error("Parâmetros 'turma' e 'dia' são obrigatórios", null, 400).send(response);
            return;
        }

        const dia = new Date(diaQuery);

        const ausentes = await this._registroService.findAusentesEntrada(turma, dia);

        StandardResponse.success("Busca realizada com sucesso", {
            registros: ausentes
        }).send(response);
    };

    /** Consulta uma chamada geral salva, para que a tela mostre as marcações existentes. */
    public findChamadaPorTurmaEDia = async (request: Request, response: Response): Promise<void> => {
        const turma = request.query.turma?.toString() || '';
        const diaTexto = request.query.dia?.toString() || '';
        const dia = new Date(diaTexto);
        if (!turma || !diaTexto || Number.isNaN(dia.getTime())) {
            StandardResponse.error("Parâmetros 'turma' e 'dia' são obrigatórios", null, 400).send(response);
            return;
        }
        const registros = await this._registroService.findChamadaPorTurmaEDia(turma, dia);
        StandardResponse.success("Chamada consultada com sucesso", { registros }).send(response);
    };

    //findById
    public findById = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.findById()");

        const registroId = _request.params.idRegistro.toString();
        const registro = await this._registroService.findById(registroId);

        StandardResponse.success("Executado com sucesso", {
            registros: registro
        }).send(response);
    };

    //update
    public update = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.update()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const registroId = request.params.idRegistro.toString();

        const registro = new Registro();
        registro.idRegistro = registroId;
        registro.falta = request.body.registro.falta;
        registro.atrasado = request.body.registro.atrasado;
        registro.nomeAcompanhante = request.body.registro.nomeAcompanhante || '';

        const atualizou = await this._registroService.update(registro, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                registros: [registro]
            }).send(response);
        } else {
            StandardResponse.notFound("Registro não encontrado para atualização", {
                registros: [registro]
            }).send(response);
        }
    };

    //delete
    public delete = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.delete()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const registro = new Registro();
        registro.idRegistro = request.params.idRegistro.toString();

        const excluiu = await this._registroService.delete(registro, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Registro não encontrado para exclusão", {
                registros: [{
                    idRegistro: registro.idRegistro
                }]
            }).send(response);
        }
    };

    //count
    public count = async (_request: Request, response: Response): Promise<void> => {
        console.log("🔵 RegistroController.count()");

        const total = await this._registroService.count();

        StandardResponse.success("Total de registros obtido", { total }).send(response);
    };
}
