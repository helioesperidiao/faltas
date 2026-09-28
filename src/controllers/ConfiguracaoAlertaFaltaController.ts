import { Request, Response } from "express";
import { ConfiguracaoAlertaFaltaService } from "@/services/ConfiguracaoAlertaFaltaService";
import { BaseController } from "./BaseController";
import { StandardResponse } from "@/http/StandardResponse";
import { Funcionario } from "@/models/Funcionario";

export class ConfiguracaoAlertaFaltaController extends BaseController {
    constructor(private readonly service: ConfiguracaoAlertaFaltaService) { super(); }

    public findAll = async (request: Request, response: Response): Promise<void> => {
        const configuracoes = await this.service.findAll(this.getFuncionarioLogado(request));
        StandardResponse.success("Configurações de alerta obtidas com sucesso", { configuracoes }).send(response);
    };

    public create = async (request: Request, response: Response): Promise<void> => {
        const dados = request.body.configuracao || {};
        const configuracao = await this.service.create(Number(dados.cargaHorariaSemanalMinutos), Number(dados.limiteFaltas), this.getFuncionarioLogado(request));
        StandardResponse.created("Configuração de alerta criada com sucesso", { configuracoes: [configuracao] }).send(response);
    };

    public update = async (request: Request, response: Response): Promise<void> => {
        const dados = request.body.configuracao || {};
        const atualizou = await this.service.update(String(request.params.idConfiguracao), Number(dados.cargaHorariaSemanalMinutos), Number(dados.limiteFaltas), this.getFuncionarioLogado(request));
        if (!atualizou) {
            StandardResponse.notFound("Configuração de alerta não encontrada").send(response);
            return;
        }
        StandardResponse.success("Configuração de alerta atualizada com sucesso").send(response);
    };

    public delete = async (request: Request, response: Response): Promise<void> => {
        const funcionario: Funcionario = this.getFuncionarioLogado(request);
        const excluiu = await this.service.delete(String(request.params.idConfiguracao), funcionario);
        if (!excluiu) {
            StandardResponse.notFound("Configuração de alerta não encontrada").send(response);
            return;
        }
        StandardResponse.noContent().send(response);
    };
}
