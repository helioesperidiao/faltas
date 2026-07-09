import { MongoClient, Db, MongoClientOptions } from "mongodb";

/**
 * Classe responsável por gerenciar a conexão com o MongoDB.
 * 
 * - Suporta passagem de URI, nome do banco e opções via construtor.
 * - Usa atributos privados para segurança.
 * - Mantém um cliente singleton (compartilhado entre todas as instâncias).
 * - Fornece o objeto Db para operações no banco.
 */
export class MongoDatabase {
    // Cliente singleton (compartilhado)
    private static _client: MongoClient | null = null;
    private static _db: Db | null = null;

    // Atributos privados de configuração
    private _uri: string;
    private _databaseName: string;
    private _options: MongoClientOptions;

    /**
     * Construtor recebe dados de conexão.
     * @param {Object} config - Objeto de configuração.
     * Exemplo:
     * {
     *   uri: "mongodb://localhost:27017",
     *   database: "gestao_rh",
     *   options: { maxPoolSize: 50, ... }
     * }
     */
    constructor(config: { uri?: string; database?: string; options?: MongoClientOptions } = {}) {
        this._uri = config.uri || "mongodb://localhost:27017";
        this._databaseName = config.database || "faltas_cti";
        this._options = config.options || {
            maxPoolSize: 50,
            minPoolSize: 10,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
    }

    /**
     * Conecta ao MongoDB e retorna o cliente.
     * Se o cliente já existir, reutiliza (singleton).
     * @returns {Promise<MongoClient>} Cliente MongoDB conectado.
     */
    async connect(): Promise<MongoClient> {
        if (!MongoDatabase._client) {
            try {
                MongoDatabase._client = new MongoClient(this._uri, this._options);
                await MongoDatabase._client.connect();
                console.log("⬆️ Conectado ao MongoDB com sucesso!");
                
                // Inicializa o banco de dados
                MongoDatabase._db = MongoDatabase._client.db(this._databaseName);
            } catch (error: any) {
                console.error("❌ Falha ao conectar ao MongoDB:", error.message);
                process.exit(1);
            }
        }
        return MongoDatabase._client;
    }

    /**
     * Retorna o cliente já existente ou cria se não existir.
     * @returns {Promise<MongoClient>} Cliente MongoDB ativo.
     */
    async getClient(): Promise<MongoClient> {
        return await this.connect();
    }

    /**
     * Retorna a instância do banco de dados (Db).
     * @returns {Promise<Db>} Objeto Db para operações.
     */
    async getDb(): Promise<Db> {
        await this.connect(); // Garante que o cliente está conectado
        return MongoDatabase._db!;
    }

    /**
     * Fecha a conexão com o MongoDB (útil para encerrar a aplicação).
     */
    async close(): Promise<void> {
        if (MongoDatabase._client) {
            await MongoDatabase._client.close();
            MongoDatabase._client = null;
            MongoDatabase._db = null;
            console.log("⬆️ Conexão com MongoDB fechada.");
        }
    }
}