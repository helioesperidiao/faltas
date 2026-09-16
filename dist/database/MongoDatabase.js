"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDatabase = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const Cargos_1 = require("@/constants/Cargos");
const GradeHorario_1 = require("@/models/GradeHorario");
dotenv_1.default.config();
class MongoDatabase {
    static _client = null;
    static _db = null;
    static _connectionPromise = null;
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
            MongoDatabase._client = new mongodb_1.MongoClient(this._uri, this._options);
            MongoDatabase._connectionPromise = MongoDatabase._client.connect()
                .then(client => {
                MongoDatabase._db = client.db(this._databaseName);
                console.log("⬆️ Conectado ao MongoDB com sucesso!");
                return client;
            })
                .catch((error) => {
                MongoDatabase._client = null;
                MongoDatabase._connectionPromise = null;
                throw error;
            });
        }
        try {
            await MongoDatabase._connectionPromise;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("❌ Falha ao conectar ao MongoDB:", message);
            throw error;
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
    async initializeSchema() {
        const db = await this.getDb();
        await Promise.all([
            db.collection("aluno").createIndex({ turma: 1, turmaInicioEm: 1 }),
            db.collection("registro").createIndex({ turma: 1, dia: 1, matricula: 1 }),
            db.collection("abonos").createIndex({ turma: 1, dataInicio: 1 }),
            db.collection("alertasFaltas").createIndex({ ano: 1, bimestre: 1, matricula: 1, turma: 1, codDisciplina: 1 })
        ]);
        await this.migrarVinculosLegados(db);
        await this.migrarCargosAceitos(db);
        await this.migrarCargaHorariaDasGrades(db);
        await this.criarConfiguracoesPadraoDeAlertas(db);
    }
    async migrarCargosAceitos(db) {
        const cargos = db.collection("cargo");
        const funcionarios = db.collection("funcionario");
        const filtroAtivo = { "auditoria.deletadoEm": null };
        const cargoPlural = await cargos.findOne({
            nomeCargo: "Processos Pedagógicos",
            ...filtroAtivo
        });
        const cargoCanonico = await cargos.findOne({
            nomeCargo: Cargos_1.CARGO_PROCESSO_PEDAGOGICO,
            ...filtroAtivo
        });
        if (cargoPlural && cargoCanonico) {
            await funcionarios.updateMany({ cargoId: cargoPlural._id, ...filtroAtivo }, { $set: { cargoId: cargoCanonico._id } });
            await cargos.updateOne({ _id: cargoPlural._id }, { $set: { "auditoria.deletadoPor": "sistema", "auditoria.deletadoEm": new Date() } });
        }
        else if (cargoPlural) {
            await cargos.updateOne({ _id: cargoPlural._id }, { $set: { nomeCargo: Cargos_1.CARGO_PROCESSO_PEDAGOGICO, "auditoria.alteradoPor": "sistema", "auditoria.alteradoEm": new Date() } });
        }
        await cargos.updateMany({ nomeCargo: { $nin: [...Cargos_1.CARGOS_ACEITOS] }, ...filtroAtivo }, { $set: { "auditoria.deletadoPor": "sistema", "auditoria.deletadoEm": new Date() } });
    }
    async migrarVinculosLegados(db) {
        const alunos = db.collection("aluno");
        const registros = db.collection("registro");
        const abonos = db.collection("abonos");
        const alunosSemInicio = await alunos.find({ turmaInicioEm: { $exists: false } }).toArray();
        if (alunosSemInicio.length > 0) {
            await alunos.bulkWrite(alunosSemInicio.map(aluno => {
                const ano = Number(aluno.ano);
                const inicio = new Date(Number.isInteger(ano) && ano >= 2000 ? ano : new Date().getFullYear(), 0, 1);
                return {
                    updateOne: {
                        filter: { _id: aluno._id },
                        update: { $set: { turmaInicioEm: inicio, historicoTurmas: aluno.historicoTurmas || [] } }
                    }
                };
            }));
        }
        const registrosSemTurma = await registros.find({ turma: { $exists: false } }).toArray();
        for (const registro of registrosSemTurma) {
            const aluno = await alunos.findOne({ matricula: registro.matricula });
            if (!aluno) {
                await registros.updateOne({ _id: registro._id }, { $set: { turma: '', curso: '', serie: '', alunoNome: '', vinculoHistoricoIndisponivel: true } });
                continue;
            }
            await registros.updateOne({ _id: registro._id }, {
                $set: {
                    turma: aluno.turma || '',
                    curso: aluno.curso || '',
                    serie: aluno.serie || '',
                    alunoNome: aluno.alunoNome || ''
                }
            });
        }
        const abonosSemTurma = await abonos.find({ turma: { $exists: false } }).toArray();
        for (const abono of abonosSemTurma) {
            const aluno = await alunos.findOne({ matricula: abono.matricula });
            if (!aluno) {
                await abonos.updateOne({ _id: abono._id }, { $set: { turma: '', curso: '', serie: '', alunoNome: '', vinculoHistoricoIndisponivel: true } });
                continue;
            }
            await abonos.updateOne({ _id: abono._id }, {
                $set: {
                    turma: aluno.turma || '',
                    curso: aluno.curso || '',
                    serie: aluno.serie || '',
                    alunoNome: aluno.alunoNome || ''
                }
            });
        }
    }
    async migrarCargaHorariaDasGrades(db) {
        const grades = db.collection("gradeHorario");
        const aulasAtivas = await grades.find({ "auditoria.deletadoEm": null }).toArray();
        const cargas = new Map();
        aulasAtivas.forEach(aula => {
            try {
                const duracao = GradeHorario_1.GradeHorario.calcularDuracaoMinutos(aula.horaInicio, aula.horaFim);
                const chave = `${aula.turma}\u0000${aula.cod}`;
                const grupo = cargas.get(chave) || { total: 0, aulas: [] };
                grupo.total += duracao;
                grupo.aulas.push({ ...aula, duracaoAulaMinutos: duracao });
                cargas.set(chave, grupo);
            }
            catch {
            }
        });
        const atualizacoes = Array.from(cargas.values()).flatMap(grupo => grupo.aulas.map(aula => ({
            updateOne: {
                filter: { _id: aula._id },
                update: {
                    $set: {
                        duracaoAulaMinutos: aula.duracaoAulaMinutos,
                        cargaHorariaSemanalMinutos: grupo.total
                    }
                }
            }
        })));
        if (atualizacoes.length > 0) {
            await grades.bulkWrite(atualizacoes);
        }
    }
    async criarConfiguracoesPadraoDeAlertas(db) {
        const configuracoes = db.collection("configuracoesAlertasFaltas");
        if (await configuracoes.countDocuments() > 0)
            return;
        const padroes = [
            { cargaHorariaSemanalMinutos: 50, limiteFaltas: 3 },
            { cargaHorariaSemanalMinutos: 100, limiteFaltas: 5 }
        ].map(configuracao => ({
            ...configuracao,
            auditoria: {
                criadoPor: "sistema",
                criadoEm: new Date(),
                alteradoPor: "",
                alteradoEm: null,
                deletadoPor: "",
                deletadoEm: null
            }
        }));
        await configuracoes.insertMany(padroes);
    }
    async close() {
        if (MongoDatabase._client) {
            await MongoDatabase._client.close();
            MongoDatabase._client = null;
            MongoDatabase._db = null;
            MongoDatabase._connectionPromise = null;
            console.log("⬆️ Conexão com MongoDB fechada.");
        }
    }
}
exports.MongoDatabase = MongoDatabase;
//# sourceMappingURL=MongoDatabase.js.map