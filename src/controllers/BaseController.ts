// src/controllers/BaseController.ts
import { Request } from "express";
import { Funcionario } from "@/models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("BaseController");

/**
 * Reúne validações e conversões comuns aos controllers da API.
 */
export abstract class BaseController {
    /**
     * Recupera do request o funcionário autenticado pelo middleware JWT.
     *
     * @throws {ErrorResponse} 401 quando o middleware JWT não populou o request.
     */
    protected getFuncionarioLogado(request: Request): Funcionario {
        log.debug("getFuncionarioLogado()");
        const funcionarioLogadoJson = (request as any).funcionarioLogado;
        if (!funcionarioLogadoJson) {
            // ✅ 401 em vez de Error genérico (antes virava 500)
            log.warn("funcionário não autenticado no request");
            throw new ErrorResponse(401, "Funcionário não autenticado");
        }

        const funcionarioLogado = new Funcionario();
        funcionarioLogado.idFuncionario = funcionarioLogadoJson.idFuncionario;
        funcionarioLogado.nomeFuncionario = funcionarioLogadoJson.nomeFuncionario;
        funcionarioLogado.email = funcionarioLogadoJson.email;
        if (funcionarioLogadoJson.cargo) {
            funcionarioLogado.cargo.idCargo = funcionarioLogadoJson.cargo.idCargo;
            funcionarioLogado.cargo.nomeCargo = funcionarioLogadoJson.cargo.nomeCargo;
        }

        return funcionarioLogado;
    }

    /**
     * Valida que o corpo da requisição contém um objeto obrigatório
     * (ex.: `{ funcionario: {...} }`, `{ cargo: {...} }`).
     * Lança ErrorResponse(400) caso contrário.
     *
     * @param request - Objeto de requisição do Express.
     * @param key - Chave do objeto obrigatório no corpo.
     * @returns O objeto contido em `request.body[key]`.
     * @throws {ErrorResponse} 400 se a chave estiver ausente ou não for objeto.
     */
    protected requireBody(request: Request, key: string): any {
        log.debug("requireBody()", { key });
        const value = request.body?.[key];
        if (!value || typeof value !== "object") {
            log.warn("corpo da requisição inválido", { key });
            throw new ErrorResponse(400, `Corpo da requisição inválido: "${key}" é obrigatório`);
        }
        return value;
    }
}