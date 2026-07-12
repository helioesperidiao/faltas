// src/controllers/BaseController.ts
import { Request } from "express";
import { Funcionario } from "@/models/Funcionario";

export abstract class BaseController {
    protected getFuncionarioLogado(request: Request): Funcionario {
        const funcionarioLogadoJson = (request as any).funcionarioLogado;
        if (!funcionarioLogadoJson) {
            throw new Error("Funcionário não autenticado");
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
}