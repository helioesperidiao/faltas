import { Request, Response } from "express";
import { StandardResponse } from "../http/StandardResponse";
import { RecuperacaoSenhaService } from "../services/RecuperacaoSenhaService";

/**
 * Controlador da recuperação de senha por e-mail.
 *
 * Todas as rotas aqui são públicas: quem esqueceu a senha, por definição, não consegue
 * autenticar. A proteção vem das regras do Service (código com validade, limite de
 * tentativas, intervalo entre pedidos e token de uso único).
 */
export class RecuperacaoSenhaController {
    private _recuperacaoSenhaService: RecuperacaoSenhaService;

    constructor(recuperacaoSenhaServiceDependency: RecuperacaoSenhaService) {
        console.log("⬆️ RecuperacaoSenhaController.constructor()");
        this._recuperacaoSenhaService = recuperacaoSenhaServiceDependency;
    }

    /**
     * Corpo da requisição em forma sempre navegável.
     *
     * O `express.json()` só popula `request.body` quando o `Content-Type` é JSON; em
     * qualquer outro caso ele fica indefinido no Express 5. Sem esta guarda, uma
     * requisição sem cabeçalho derrubava a rota com 500 e devolvia a mensagem interna
     * do erro em vez da validação em português. Como estas rotas são públicas, o corpo
     * chega exatamente como o cliente quis mandar.
     */
    private corpo(request: Request): Record<string, unknown> {
        const corpo = request.body;
        return corpo && typeof corpo === "object" ? corpo as Record<string, unknown> : {};
    }

    /**
     * Envia o código de recuperação para o e-mail informado.
     *
     * @route POST /api/v1/auth/esqueci-senha
     * @param request - Requisição contendo `{ email: string }`.
     * @returns 200 OK com uma mensagem neutra, exista o e-mail ou não.
     */
    public esqueciSenha = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RecuperacaoSenhaController.esqueciSenha()");

        await this._recuperacaoSenhaService.solicitarCodigo(
            String(this.corpo(request).email ?? "")
        );

        StandardResponse.success(
            "Se o e-mail estiver cadastrado, o código foi enviado."
        ).send(response);
    };

    /**
     * Valida o código digitado e devolve o token que autoriza a troca da senha.
     *
     * @route POST /api/v1/auth/validar-codigo
     * @param request - Requisição contendo `{ email: string, codigo: string }`.
     * @returns 200 OK com `{ tokenReset }`.
     */
    public validarCodigo = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RecuperacaoSenhaController.validarCodigo()");

        const corpo = this.corpo(request);
        const tokenReset = await this._recuperacaoSenhaService.validarCodigo(
            String(corpo.email ?? ""),
            String(corpo.codigo ?? "")
        );

        StandardResponse.success("Código validado com sucesso.", { tokenReset }).send(response);
    };

    /**
     * Grava a nova senha.
     *
     * @route POST /api/v1/auth/redefinir-senha
     * @param request - Requisição contendo `{ tokenReset: string, novaSenha: string }`.
     * @returns 200 OK. Não cria sessão: o usuário volta ao login e entra com a senha nova.
     */
    public redefinirSenha = async (request: Request, response: Response): Promise<void> => {
        console.log("🔵 RecuperacaoSenhaController.redefinirSenha()");

        const corpo = this.corpo(request);
        await this._recuperacaoSenhaService.redefinirSenha(
            String(corpo.tokenReset ?? ""),
            String(corpo.novaSenha ?? "")
        );

        StandardResponse.success("Senha alterada com sucesso. Entre com a nova senha.").send(response);
    };
}
