import { Router } from "express";
import { RecuperacaoSenhaController } from "../controllers/RecuperacaoSenhaController";
import { RecuperacaoSenhaService } from "../services/RecuperacaoSenhaService";
import { RecuperacaoSenhaDAO } from "../dao/RecuperacaoSenhaDAO";
import { EmailService } from "../services/EmailService";
import { MongoDatabase } from "../database/MongoDatabase";

/**
 * Roteador da recuperação de senha ("esqueci minha senha").
 *
 * As rotas são prefixadas com `/api/v1/auth` e, ao contrário das demais, **não** passam
 * pelo JwtMiddleware: quem esqueceu a senha não tem como se autenticar. O controle de
 * abuso fica nas regras do RecuperacaoSenhaService.
 *
 * @example
 * const recuperacaoSenhaRouter = new RecuperacaoSenhaRouter(dataBase);
 * app.use(recuperacaoSenhaRouter.getRouter());
 */
export class RecuperacaoSenhaRouter {
    /** Prefixo base para todas as rotas de recuperação de senha. */
    public static readonly PREFIX = "/api/v1/auth";

    private _router: Router;
    private _dataBase: MongoDatabase;

    constructor(dataBase: MongoDatabase) {
        console.log("⬆️ RecuperacaoSenhaRouter.constructor()");
        this._router = Router();
        this._dataBase = dataBase;

        // Instancia as dependências
        const recuperacaoSenhaDAO = new RecuperacaoSenhaDAO(this._dataBase);
        const emailService = new EmailService();
        const recuperacaoSenhaService = new RecuperacaoSenhaService(recuperacaoSenhaDAO, emailService);
        const recuperacaoSenhaController = new RecuperacaoSenhaController(recuperacaoSenhaService);

        // ======================== ROTAS ========================

        // POST /esqueci-senha - Envia o código de recuperação por e-mail (público)
        this._router.post(RecuperacaoSenhaRouter.PREFIX + "/esqueci-senha",
            recuperacaoSenhaController.esqueciSenha
        );

        // POST /validar-codigo - Valida o código e devolve o tokenReset (público)
        this._router.post(RecuperacaoSenhaRouter.PREFIX + "/validar-codigo",
            recuperacaoSenhaController.validarCodigo
        );

        // POST /redefinir-senha - Grava a nova senha usando o tokenReset (público)
        this._router.post(RecuperacaoSenhaRouter.PREFIX + "/redefinir-senha",
            recuperacaoSenhaController.redefinirSenha
        );
    }

    /**
     * Retorna o router principal com todas as rotas configuradas.
     *
     * @returns Router do Express com as rotas de recuperação de senha.
     */
    public getRouter = (): Router => {
        return this._router;
    };
}
