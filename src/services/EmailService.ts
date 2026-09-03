/**
 * Envio de e-mail do sistema.
 *
 * Usa o nodemailer quando ele está instalado e o SMTP configurado no .env. Se faltar
 * qualquer uma das duas coisas, cai em "modo desenvolvimento": o e-mail não sai, mas o
 * conteúdo é impresso no console do servidor. Isso mantém o fluxo de recuperação de
 * senha testável antes de existir uma conta SMTP, sem transformar a ausência de
 * configuração em erro de execução.
 *
 * Variáveis esperadas no .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 */
export class EmailService {
    private _transporter: any = null;
    private _inicializado: boolean = false;

    /**
     * Diz se há configuração de SMTP suficiente no ambiente.
     */
    private get configurado(): boolean {
        return Boolean(
            process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD
        );
    }

    /**
     * Cria o transporte do nodemailer sob demanda.
     *
     * O import é dinâmico de propósito: assim o projeto compila e roda mesmo antes de
     * `npm install nodemailer`, e só quem realmente for enviar e-mail precisa do pacote.
     */
    private async obterTransporter(): Promise<any> {
        if (this._inicializado) return this._transporter;
        this._inicializado = true;

        if (!this.configurado) {
            console.warn("⚠️  SMTP não configurado no .env — os e-mails serão apenas impressos no console.");
            return null;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodemailer = require("nodemailer");
            this._transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        } catch {
            console.warn("⚠️  Pacote 'nodemailer' não instalado — os e-mails serão apenas impressos no console.");
            console.warn("    Instale com: npm install nodemailer && npm install --save-dev @types/nodemailer");
            this._transporter = null;
        }

        return this._transporter;
    }

    /**
     * Envia um e-mail. Nunca lança: uma falha de envio não pode derrubar o fluxo nem
     * revelar, pelo comportamento da API, se o destinatário existe no sistema.
     *
     * @param para - Endereço de destino.
     * @param assunto - Assunto da mensagem.
     * @param texto - Corpo em texto puro.
     * @param html - Corpo em HTML (opcional).
     * @returns true se o e-mail saiu de fato; false se foi apenas registrado no console.
     */
    public async enviar(para: string, assunto: string, texto: string, html?: string): Promise<boolean> {
        const transporter = await this.obterTransporter();

        if (!transporter) {
            console.log("📧 [modo desenvolvimento] E-mail que seria enviado:");
            console.log("   Para....: " + para);
            console.log("   Assunto.: " + assunto);
            console.log("   Corpo...: " + texto);
            return false;
        }

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: para,
                subject: assunto,
                text: texto,
                html: html || undefined
            });
            return true;
        } catch (erro) {
            console.error("❌ Falha ao enviar e-mail para " + para + ":", erro);
            return false;
        }
    }
}
