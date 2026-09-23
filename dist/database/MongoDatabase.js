"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDatabase = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class MongoDatabase {
    static _client = null;
    static _db = null;
    _uri;
    _databaseName;
    _options;
    constructor(config = {}) {
        const envUri = process.env.MONGO_URI;
        const envDatabase = process.env.MONGO_DATABASE;
        const envMaxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE || '');
        const envMinPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE || '');
        const envConnectTimeout = parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS || '');
        const envSocketTimeout = parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '');
        this._uri = config.uri || envUri || "mongodb://localhost:27017";
        this._databaseName = config.database || envDatabase || "faltas_cti";
        this._options = {
            maxPoolSize: config.options?.maxPoolSize || (isNaN(envMaxPoolSize) ? 50 : envMaxPoolSize),
            minPoolSize: config.options?.minPoolSize || (isNaN(envMinPoolSize) ? 10 : envMinPoolSize),
            connectTimeoutMS: config.options?.connectTimeoutMS || (isNaN(envConnectTimeout) ? 5000 : envConnectTimeout),
            socketTimeoutMS: config.options?.socketTimeoutMS || (isNaN(envSocketTimeout) ? 45000 : envSocketTimeout),
            ...config.options,
        };
        console.log(`🔧 MongoDatabase configurado:
  URI: ${this._uri}
  Database: ${this._databaseName}
  MaxPoolSize: ${this._options.maxPoolSize}
  MinPoolSize: ${this._options.minPoolSize}
  ConnectTimeout: ${this._options.connectTimeoutMS}ms
  SocketTimeout: ${this._options.socketTimeoutMS}ms`);
    }
    async connect() {
        if (!MongoDatabase._client) {
            try {
                MongoDatabase._client = new mongodb_1.MongoClient(this._uri, this._options);
                await MongoDatabase._client.connect();
                console.log("⬆️ Conectado ao MongoDB com sucesso!");
                MongoDatabase._db = MongoDatabase._client.db(this._databaseName);
            }
            catch (error) {
                console.error("❌ Falha ao conectar ao MongoDB:", error.message);
                process.exit(1);
            }
        }
        return MongoDatabase._client;
    }
    async getClient() {
        return await this.connect();
    }
    async getDb() {
        await this.connect();
        return MongoDatabase._db;
    }
    async close() {
        if (MongoDatabase._client) {
            await MongoDatabase._client.close();
            MongoDatabase._client = null;
            MongoDatabase._db = null;
            console.log("⬆️ Conexão com MongoDB fechada.");
        }
    }
}
exports.MongoDatabase = MongoDatabase;
//# sourceMappingURL=MongoDatabase.js.map