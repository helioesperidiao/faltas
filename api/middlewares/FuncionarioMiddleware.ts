import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../http/ErrorResponse";


/**
 * Middleware para validação de requisições relacionadas à entidade Funcionario.
 * 
 * Objetivo:
 * - Garantir que os dados obrigatórios estejam presentes antes de chamar
 *   os métodos do Controller ou Service.
 * - Lançar erros padronizados usando ErrorResponse quando a validação falhar.
 */
export class FuncionarioMiddleware {

    /**
     * Valida o corpo da requisição para criação de um novo funcionário.
     * 
     * Verifica:
     * - Se o objeto 'funcionario' existe
     * - Campos obrigatórios: nomeFuncionario, email, senha, recebeValeTransporte
     * - Tipo e valor de recebeValeTransporte (0 ou 1)
     * - Objeto 'cargo' presente e válido
     * - idCargo é um inteiro positivo
     * 
     * @param {Request} request - Objeto de requisição do Express
     * @param {Response} response - Objeto de resposta do Express
     * @param {NextFunction} next - Função next() para passar para o próximo middleware
     * 
     * Lança ErrorResponse com código HTTP 400 em caso de validação falha.
     */
    validateCreateBody = (request: Request, response: Response, next: NextFunction): void => {
        console.log("🔷 FuncionarioMiddleware.validateCreateBody()");
        const body = request.body;

        if (!body.funcionario) {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O campo 'funcionario' é obrigatório!" });
        }

        const funcionario = body.funcionario;

        const camposObrigatorios = ["nomeFuncionario", "email", "senha", "recebeValeTransporte"];
        for (const campo of camposObrigatorios) {
            if (funcionario[campo] === undefined || funcionario[campo] === null || funcionario[campo] === "") {
                throw new ErrorResponse(400, "Erro na validação de dados", { message: `O campo '${campo}' é obrigatório!` });
            }
        }

        // Converte para número para validação, pois pode vir como string
        const recebeVale = Number(funcionario.recebeValeTransporte);
        if (![0, 1].includes(recebeVale)) {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O campo 'recebeValeTransporte' deve ser 0 ou 1" });
        }

        if (!funcionario.cargo || typeof funcionario.cargo !== "object") {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O campo 'cargo' é obrigatório e deve ser um objeto" });
        }

        const idCargo = Number(funcionario.cargo.idCargo);
        if (!Number.isInteger(idCargo) || idCargo <= 0) {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O campo 'idCargo' deve ser um número inteiro positivo" });
        }

        next();
    };

    /**
     * Valida o corpo da requisição para login de um funcionário.
     * 
     * Verifica:
     * - Se o objeto 'funcionario' existe
     * - Campos obrigatórios: email, senha
     * - Formato básico de email
     * 
     * @param {Request} request - Objeto de requisição do Express
     * @param {Response} response - Objeto de resposta do Express
     * @param {NextFunction} next - Função next() para passar para o próximo middleware
     * 
     * Lança ErrorResponse com código HTTP 400 em caso de validação falha.
     */
    validateLoginBody = (request: Request, response: Response, next: NextFunction): void => {
        console.log("🔷 FuncionarioMiddleware.validateLoginBody()");
        const body = request.body;

        if (!body.funcionario) {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O campo 'funcionario' é obrigatório!" });
        }

        const funcionario = body.funcionario;

        const camposObrigatorios = ["email", "senha"];
        for (const campo of camposObrigatorios) {
            if (!funcionario[campo] || funcionario[campo].toString().trim() === "") {
                throw new ErrorResponse(400, "Erro na validação de dados", { message: `O campo '${campo}' é obrigatório!` });
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(funcionario.email)) {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O campo 'email' não é um e-mail válido" });
        }

        next();
    };

    /**
     * Valida o parâmetro de rota 'idFuncionario' em requisições que necessitam de identificação do funcionário.
     * 
     * Verifica:
     * - Se o parâmetro 'idFuncionario' foi passado na URL
     * 
     * @param {Request} request - Objeto de requisição do Express
     * @param {Response} response - Objeto de resposta do Express
     * @param {NextFunction} next - Função next() para passar para o próximo middleware
     * 
     * Lança ErrorResponse com código HTTP 400 caso 'idFuncionario' não seja fornecido.
     */
    validateIdParam = (request: Request, response: Response, next: NextFunction): void => {
        console.log("🔷 FuncionarioMiddleware.validateIdParam()");
        const { idFuncionario } = request.params;

        if (!idFuncionario) {
            throw new ErrorResponse(400, "Erro na validação de dados", { message: "O parâmetro 'idFuncionario' é obrigatório!" });
        }

        next();
    };
}