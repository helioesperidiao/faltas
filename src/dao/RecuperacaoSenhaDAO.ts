import { Collection, Document, Filter } from "mongodb";
import { MongoDatabase } from "../database/MongoDatabase";

/**
 * Documento de um pedido de recuperação de senha, como fica gravado no Mongo.
 *
 * O código em si nunca é gravado: só o hash dele. Quem tiver acesso de leitura ao banco
 * não consegue reconstruir o código enviado por e-mail.
 */
export interface PedidoRecuperacao {
    /** E-mail normalizado (minúsculo, sem espaços) — é a chave de busca do fluxo. */
    email: string;
    /**
     * E-mail exatamente como está gravado no funcionário.
     *
     * Guardado à parte porque o cadastro não normaliza a caixa: existe funcionário com
     * "Fulano@Escola.com". A busca do fluxo usa a forma normalizada, mas o update da
     * senha precisa da grafia original para casar com o documento certo.
     */
    emailFuncionario: string;
    codigoHash: string;
    tokenReset: string | null;
    expiraEm: Date;
    tentativas: number;
    usado: boolean;
    criadoEm: Date;
}

/**
 * Acesso à coleção de pedidos de recuperação de senha e à troca da senha do funcionário.
 */
export class RecuperacaoSenhaDAO {
    private _database: MongoDatabase;

    constructor(dbInstance: MongoDatabase) {
        console.log("⬆️ RecuperacaoSenhaDAO.constructor()");
        this._database = dbInstance;
    }

    /** Coleção que guarda os pedidos de recuperação. */
    private async getCollection(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("recuperacaoSenha");
    }

    /** Coleção de funcionários — usada só para gravar a nova senha. */
    private async getColecaoFuncionario(): Promise<Collection<Document>> {
        const db = await this._database.getDb();
        return db.collection("funcionario");
    }

    /**
     * Invalida todos os pedidos em aberto de um e-mail e grava o novo.
     *
     * Invalidar os anteriores garante que só o último código enviado funcione: sem isso,
     * pedir um código novo deixaria o antigo valendo até expirar.
     */
    public async criar(pedido: PedidoRecuperacao): Promise<void> {
        console.log(`🟢 RecuperacaoSenhaDAO.criar(${pedido.email})`);
        const collection = await this.getCollection();

        await collection.updateMany(
            { email: pedido.email, usado: false },
            { $set: { usado: true } }
        );

        await collection.insertOne({ ...pedido });
    }

    /** Último pedido ainda não usado de um e-mail, se houver. */
    public async buscarPedidoAberto(email: string): Promise<(PedidoRecuperacao & { _id: any }) | null> {
        const collection = await this.getCollection();
        const filtro: Filter<Document> = { email, usado: false };
        const documento = await collection.findOne(filtro, { sort: { criadoEm: -1 } });
        return documento as (PedidoRecuperacao & { _id: any }) | null;
    }

    /** Pedido correspondente a um tokenReset ainda válido. */
    public async buscarPorTokenReset(tokenReset: string): Promise<(PedidoRecuperacao & { _id: any }) | null> {
        const collection = await this.getCollection();
        const documento = await collection.findOne({ tokenReset, usado: false });
        return documento as (PedidoRecuperacao & { _id: any }) | null;
    }

    /** Momento do último pedido de um e-mail, usado para limitar reenvios. */
    public async ultimoPedidoEm(email: string): Promise<Date | null> {
        const collection = await this.getCollection();
        const documento = await collection.findOne({ email }, { sort: { criadoEm: -1 } });
        return documento ? (documento.criadoEm as Date) : null;
    }

    /** Soma 1 à contagem de tentativas erradas do pedido. */
    public async registrarTentativa(id: any): Promise<void> {
        const collection = await this.getCollection();
        await collection.updateOne({ _id: id }, { $inc: { tentativas: 1 } });
    }

    /** Marca o pedido como consumido — um código só vale uma vez. */
    public async marcarUsado(id: any): Promise<void> {
        const collection = await this.getCollection();
        await collection.updateOne({ _id: id }, { $set: { usado: true } });
    }

    /** Guarda o tokenReset gerado após o código ser validado com sucesso. */
    public async gravarTokenReset(id: any, tokenReset: string): Promise<void> {
        const collection = await this.getCollection();
        await collection.updateOne({ _id: id }, { $set: { tokenReset } });
    }

    /**
     * Devolve o e-mail do funcionário na grafia exata em que está gravado, ou null se
     * não houver funcionário com esse endereço.
     *
     * A comparação ignora a caixa de propósito: o cadastro grava o e-mail como foi
     * digitado, então quem se cadastrou como "Fulano@Escola.com" não encontraria o
     * próprio registro se a busca fosse literal. Usa `collation` em vez de regex para
     * não precisar escapar o que o usuário digitou. Só o endereço é devolvido — nenhum
     * outro dado do funcionário sai daqui.
     */
    public async buscarEmailCadastrado(email: string): Promise<string | null> {
        const collection = await this.getColecaoFuncionario();
        const documento = await collection.findOne(
            { email },
            {
                projection: { email: 1 },
                collation: { locale: "pt", strength: 2 }
            }
        );
        return documento ? (documento.email as string) : null;
    }

    /**
     * Grava a nova senha (já com hash) do funcionário.
     *
     * O `email` recebido aqui é o `emailFuncionario` do pedido — a grafia exata do
     * cadastro —, por isso a comparação pode ser literal.
     *
     * Toca apenas o campo `senha`, de propósito: reaproveitar o update completo do
     * FuncionarioDAO exigiria um funcionário logado para a auditoria e reescreveria
     * campos que a recuperação de senha não tem por que alterar.
     */
    public async atualizarSenhaPorEmail(email: string, senhaHash: string): Promise<boolean> {
        console.log(`🟢 RecuperacaoSenhaDAO.atualizarSenhaPorEmail(${email})`);
        const collection = await this.getColecaoFuncionario();
        const resultado = await collection.updateOne(
            { email },
            { $set: { senha: senhaHash, "auditoria.alteradoEm": new Date() } }
        );
        return resultado.modifiedCount > 0;
    }
}
