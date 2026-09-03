import bcrypt from "bcrypt";
import crypto from "crypto";
import { ErrorResponse } from "../http/ErrorResponse";
import { RecuperacaoSenhaDAO } from "../dao/RecuperacaoSenhaDAO";
import { EmailService } from "./EmailService";

/**
 * Regras da recuperação de senha por código enviado ao e-mail.
 *
 * Decisões de segurança que valem para todo o fluxo:
 *
 * - Pedir um código responde sempre a mesma coisa, exista o e-mail ou não. Responder
 *   "e-mail não encontrado" transformaria a tela de login num verificador de quais
 *   endereços estão cadastrados.
 * - Só o hash do código é gravado; o código em texto puro existe apenas no e-mail.
 * - O código vale 15 minutos, aceita no máximo 5 tentativas e serve uma única vez.
 * - Pedir outro código invalida o anterior, e há um intervalo mínimo entre pedidos.
 */
export class RecuperacaoSenhaService {
    /** Tempo de vida do código, em minutos. */
    private static readonly VALIDADE_MINUTOS = 15;
    /** Tentativas de digitação do código antes de invalidá-lo. */
    private static readonly MAX_TENTATIVAS = 5;
    /** Intervalo mínimo entre dois pedidos de código para o mesmo e-mail, em segundos. */
    private static readonly INTERVALO_ENTRE_PEDIDOS_SEGUNDOS = 60;

    private _recuperacaoSenhaDAO: RecuperacaoSenhaDAO;
    private _emailService: EmailService;

    constructor(recuperacaoSenhaDAODependency: RecuperacaoSenhaDAO, emailServiceDependency: EmailService) {
        console.log("⬆️  RecuperacaoSenhaService.constructor()");
        this._recuperacaoSenhaDAO = recuperacaoSenhaDAODependency;
        this._emailService = emailServiceDependency;
    }

    /** Normaliza o e-mail para que a busca não dependa de caixa nem de espaço sobrando. */
    private normalizarEmail(email: string): string {
        return String(email || "").trim().toLowerCase();
    }

    /** Código de 6 dígitos com fonte aleatória criptográfica. */
    private gerarCodigo(): string {
        return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    }

    /**
     * Passo 1 — pedir o código.
     *
     * @param email - E-mail informado na tela.
     * @returns Sempre resolve; nunca revela se o e-mail existe.
     */
    public solicitarCodigo = async (email: string): Promise<void> => {
        console.log("🟣 RecuperacaoSenhaService.solicitarCodigo()");

        const emailNormalizado = this.normalizarEmail(email);
        if (!emailNormalizado || !emailNormalizado.includes("@")) {
            throw new ErrorResponse(400, "Informe um e-mail válido.");
        }

        // Limite de reenvio: vale mesmo para e-mail inexistente, senão o tempo de
        // resposta denunciaria quais endereços estão cadastrados.
        const ultimoPedido = await this._recuperacaoSenhaDAO.ultimoPedidoEm(emailNormalizado);
        if (ultimoPedido) {
            const segundosDesdeUltimo = (Date.now() - new Date(ultimoPedido).getTime()) / 1000;
            if (segundosDesdeUltimo < RecuperacaoSenhaService.INTERVALO_ENTRE_PEDIDOS_SEGUNDOS) {
                throw new ErrorResponse(429, "Aguarde um minuto antes de pedir um novo código.");
            }
        }

        // Devolve a grafia exata do cadastro, comparando sem diferenciar maiúsculas: o
        // cadastro de funcionário não normaliza o e-mail, então procurar pela forma
        // minúscula deixaria quem se cadastrou como "Fulano@Escola.com" sem receber nada
        // — e, pior, em silêncio, porque a resposta da API é neutra de propósito.
        const emailCadastrado = await this._recuperacaoSenhaDAO.buscarEmailCadastrado(emailNormalizado);
        if (!emailCadastrado) {
            // Sai em silêncio: do lado de fora, indistinguível do caso de sucesso.
            console.log("ℹ️  Pedido de recuperação para e-mail não cadastrado — nada enviado.");
            return;
        }

        const codigo = this.gerarCodigo();
        const codigoHash = await bcrypt.hash(codigo, 12);
        const expiraEm = new Date(Date.now() + RecuperacaoSenhaService.VALIDADE_MINUTOS * 60 * 1000);

        await this._recuperacaoSenhaDAO.criar({
            email: emailNormalizado,
            emailFuncionario: emailCadastrado,
            codigoHash,
            tokenReset: null,
            expiraEm,
            tentativas: 0,
            usado: false,
            criadoEm: new Date()
        });

        const assunto = "Código de recuperação de senha - UNIVAP";
        const texto =
            "Seu código de recuperação de senha é " + codigo + ".\n\n" +
            "Ele vale por " + RecuperacaoSenhaService.VALIDADE_MINUTOS + " minutos e só pode ser usado uma vez.\n" +
            "Se você não pediu a troca de senha, ignore esta mensagem: sua senha atual continua valendo.";
        const html =
            '<p>Seu código de recuperação de senha é:</p>' +
            '<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">' + codigo + '</p>' +
            '<p>Ele vale por ' + RecuperacaoSenhaService.VALIDADE_MINUTOS + ' minutos e só pode ser usado uma vez.</p>' +
            '<p>Se você não pediu a troca de senha, ignore esta mensagem: sua senha atual continua valendo.</p>';

        await this._emailService.enviar(emailCadastrado, assunto, texto, html);
    };

    /**
     * Passo 2 — validar o código digitado.
     *
     * @returns O tokenReset de uso único que autoriza a troca da senha.
     */
    public validarCodigo = async (email: string, codigo: string): Promise<string> => {
        console.log("🟣 RecuperacaoSenhaService.validarCodigo()");

        const emailNormalizado = this.normalizarEmail(email);
        const codigoInformado = String(codigo || "").trim();

        if (!emailNormalizado || !codigoInformado) {
            throw new ErrorResponse(400, "Informe o e-mail e o código recebido.");
        }

        const pedido = await this._recuperacaoSenhaDAO.buscarPedidoAberto(emailNormalizado);
        if (!pedido) {
            throw new ErrorResponse(400, "Código inválido ou expirado. Peça um novo código.");
        }

        if (new Date(pedido.expiraEm).getTime() < Date.now()) {
            await this._recuperacaoSenhaDAO.marcarUsado(pedido._id);
            throw new ErrorResponse(400, "Código expirado. Peça um novo código.");
        }

        if (pedido.tentativas >= RecuperacaoSenhaService.MAX_TENTATIVAS) {
            await this._recuperacaoSenhaDAO.marcarUsado(pedido._id);
            throw new ErrorResponse(429, "Número de tentativas excedido. Peça um novo código.");
        }

        const codigoConfere = await bcrypt.compare(codigoInformado, pedido.codigoHash);
        if (!codigoConfere) {
            await this._recuperacaoSenhaDAO.registrarTentativa(pedido._id);
            throw new ErrorResponse(400, "Código inválido.");
        }

        const tokenReset = crypto.randomBytes(32).toString("hex");
        await this._recuperacaoSenhaDAO.gravarTokenReset(pedido._id, tokenReset);
        return tokenReset;
    };

    /**
     * Passo 3 — gravar a nova senha.
     *
     * Consome o tokenReset: depois desta chamada, ele não vale mais.
     */
    public redefinirSenha = async (tokenReset: string, novaSenha: string): Promise<void> => {
        console.log("🟣 RecuperacaoSenhaService.redefinirSenha()");

        const token = String(tokenReset || "").trim();
        const senha = String(novaSenha || "");

        if (!token) {
            throw new ErrorResponse(400, "Pedido de troca de senha inválido. Recomece o processo.");
        }
        if (senha.length < 8) {
            throw new ErrorResponse(400, "A nova senha deve ter pelo menos 8 caracteres.");
        }

        const pedido = await this._recuperacaoSenhaDAO.buscarPorTokenReset(token);
        if (!pedido) {
            throw new ErrorResponse(400, "Pedido de troca de senha inválido ou já utilizado. Recomece o processo.");
        }

        if (new Date(pedido.expiraEm).getTime() < Date.now()) {
            await this._recuperacaoSenhaDAO.marcarUsado(pedido._id);
            throw new ErrorResponse(400, "Pedido expirado. Recomece o processo.");
        }

        // Usa a grafia exata do cadastro; `pedido.email` é a forma normalizada e não
        // casaria com um funcionário gravado com maiúsculas. O `||` cobre pedidos
        // gravados antes deste campo existir.
        const senhaHash = await bcrypt.hash(senha, 12);
        const emailAlvo = pedido.emailFuncionario || pedido.email;
        const trocou = await this._recuperacaoSenhaDAO.atualizarSenhaPorEmail(emailAlvo, senhaHash);

        // O pedido é consumido mesmo se o update não alterar nada (senha idêntica à
        // anterior, por exemplo): o token é de uso único em qualquer cenário.
        await this._recuperacaoSenhaDAO.marcarUsado(pedido._id);

        if (!trocou) {
            throw new ErrorResponse(500, "Não foi possível trocar a senha. Tente novamente.");
        }
    };
}
