import { MongoClient, Db, MongoClientOptions } from "mongodb";
import dotenv from "dotenv";

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Classe responsável por gerenciar a conexão com o MongoDB.
 * 
 * - Suporta passagem de URI, nome do banco e opções via construtor.
 * - Prioriza variáveis de ambiente (se definidas) sobre os valores padrão.
 * - Usa atributos privados para segurança.
 * - Mantém um cliente singleton (compartilhado entre todas as instâncias).
 * - Fornece o objeto Db para operações no banco.
 * 
 * @example
 * // Configuração via .env (recomendado)
 * // .env:
 * // MONGO_URI=mongodb://localhost:27017
 * // MONGO_DATABASE=meu_banco
 * // MONGO_MAX_POOL_SIZE=100
 * 
 * const db = new MongoDatabase();
 * await db.connect();
 * 
 * // Ou passando configurações diretamente (sobrescreve .env)
 * const db = new MongoDatabase({
 *   uri: "mongodb://localhost:27017",
 *   database: "gestao_rh"
 * });
 */
export class MongoDatabase {
    // ======================== SINGLETON ========================

    /** Cliente singleton compartilhado entre todas as instâncias. */
    private static _client: MongoClient | null = null;
    /** Instância do banco de dados singleton. */
    private static _db: Db | null = null;

    // ======================== CONFIGURAÇÃO ========================

    /** URI de conexão com o MongoDB. */
    private _uri: string;
    /** Nome do banco de dados a ser utilizado. */
    private _databaseName: string;
    /** Opções de configuração do cliente MongoDB. */
    private _options: MongoClientOptions;

    // ======================== CONSTRUTOR ========================

    /**
     * Construtor da classe MongoDatabase.
     * 
     * As configurações são carregadas na seguinte ordem de prioridade:
     * 1. Valores passados no objeto `config`.
     * 2. Variáveis de ambiente (ex: `MONGO_URI`, `MONGO_DATABASE`, `MONGO_MAX_POOL_SIZE`, etc.).
     * 3. Valores padrão (fallback).
     * 
     * @param config - Objeto opcional para sobrescrever as variáveis de ambiente.
     * @param config.uri - URI do MongoDB (padrão: variável `MONGO_URI` ou "mongodb://localhost:27017").
     * @param config.database - Nome do banco de dados (padrão: variável `MONGO_DATABASE` ou "faltas_cti").
     * @param config.options - Opções adicionais do MongoClient (ex: maxPoolSize, minPoolSize, etc.).
     *                        As opções podem ser definidas via variáveis de ambiente com prefixo `MONGO_`.
     * 
     * @example
     * // Usando .env
     * const db = new MongoDatabase();
     * 
     * // Sobrescrevendo via construtor
     * const db = new MongoDatabase({
     *   uri: "mongodb://localhost:27017",
     *   database: "gestao_rh",
     *   options: { maxPoolSize: 100 }
     * });
     */
    constructor(config: { uri?: string; database?: string; options?: MongoClientOptions } = {}) {
        // Carrega variáveis de ambiente
        const envUri = process.env.MONGO_URI;
        const envDatabase = process.env.MONGO_DATABASE;
        const envMaxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE || '');
        const envMinPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE || '');
        const envConnectTimeout = parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS || '');
        const envSocketTimeout = parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '');

        // Define URI (prioridade: config.uri > envUri > padrão)
        this._uri = config.uri || envUri || "mongodb://localhost:27017";

        // Define database (prioridade: config.database > envDatabase > padrão)
        this._databaseName = config.database || envDatabase || "faltas_cti";

        // Define opções (prioridade: config.options > env > padrão)
        this._options = {
            maxPoolSize: config.options?.maxPoolSize || (isNaN(envMaxPoolSize) ? 50 : envMaxPoolSize),
            minPoolSize: config.options?.minPoolSize || (isNaN(envMinPoolSize) ? 10 : envMinPoolSize),
            connectTimeoutMS: config.options?.connectTimeoutMS || (isNaN(envConnectTimeout) ? 5000 : envConnectTimeout),
            socketTimeoutMS: config.options?.socketTimeoutMS || (isNaN(envSocketTimeout) ? 45000 : envSocketTimeout),
            ...config.options, // Permite sobrescrever outras opções não mapeadas
        };

        console.log(`🔧 MongoDatabase configurado:
  URI: ${this._uri}
  Database: ${this._databaseName}
  MaxPoolSize: ${this._options.maxPoolSize}
  MinPoolSize: ${this._options.minPoolSize}
  ConnectTimeout: ${this._options.connectTimeoutMS}ms
  SocketTimeout: ${this._options.socketTimeoutMS}ms`);
    }

    // ======================== MÉTODOS PÚBLICOS ========================

    /**
     * Conecta ao MongoDB e retorna o cliente.
     * 
     * Se o cliente já existir (singleton), reutiliza a conexão existente.
     * Em caso de erro, encerra o processo com código 1.
     * 
     * @returns Cliente MongoDB conectado.
     * @throws {Error} Se a conexão falhar (o processo é encerrado).
     * 
     * @example
     * const client = await db.connect();
     * console.log(client.topology.s.description);
     */
    public async connect(): Promise<MongoClient> {
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
     * Retorna o cliente MongoDB já existente ou cria uma nova conexão.
     * 
     * @returns Cliente MongoDB ativo (conectado).
     * 
     * @example
     * const client = await db.getClient();
     */
    public async getClient(): Promise<MongoClient> {
        return await this.connect();
    }

    /**
     * Retorna a instância do banco de dados (Db) para operações.
     * 
     * Garante que a conexão esteja ativa antes de retornar o objeto Db.
     * 
     * @returns Objeto Db do MongoDB.
     * 
     * @example
     * const db = await dbConnection.getDb();
     * const colecao = db.collection("funcionarios");
     * const docs = await colecao.find({}).toArray();
     */
    public async getDb(): Promise<Db> {
        await this.connect(); // Garante que o cliente está conectado
        return MongoDatabase._db!;
    }

    /**
     * Fecha a conexão com o MongoDB.
     * 
     * Útil para encerrar a aplicação de forma limpa, liberando recursos.
     * Após o fechamento, o singleton é reiniciado (cliente e db null).
     * 
     * @returns Promise void.
     * 
     * @example
     * // Em um encerramento gracioso da aplicação
     * process.on('SIGTERM', async () => {
     *   await db.close();
     *   process.exit(0);
     * });
     */
    public async close(): Promise<void> {
        if (MongoDatabase._client) {
            await MongoDatabase._client.close();
            MongoDatabase._client = null;
            MongoDatabase._db = null;
            console.log("⬆️ Conexão com MongoDB fechada.");
        }
    }
}