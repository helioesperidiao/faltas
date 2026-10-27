"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const Cargo_1 = require("../models/Cargo");
const Funcionario_1 = require("../models/Funcionario");
const ErrorResponse_1 = require("../http/ErrorResponse");
const MeuTokenJWT_1 = require("../http/MeuTokenJWT");
const Cargos_1 = require("@/constants/Cargos");
class FuncionarioService {
    _funcionarioDAO;
    _cargoDAO;
    constructor(funcionarioDAODependency, cargoDAODependency) {
        console.log("⬆️  FuncionarioService.constructor()");
        this._funcionarioDAO = funcionarioDAODependency;
        this._cargoDAO = cargoDAODependency;
        this.initializeDefaultAdmin();
    }
    initializeDefaultAdmin = async () => {
        console.log("🟣 FuncionarioService.initializeDefaultAdmin()");
        const totalFuncionarios = await this._funcionarioDAO.count();
        if (totalFuncionarios > 0) {
            console.log("✅ Já existem funcionários cadastrados. Pulando criação do admin padrão.");
            return;
        }
        const funcionarioSistema = new Funcionario_1.Funcionario();
        funcionarioSistema.idFuncionario = "000000000000000000000000";
        funcionarioSistema.nomeFuncionario = "Sistema";
        funcionarioSistema.email = "sistema@empresa.com";
        console.log("🔧 Criando/verificando cargo Processo Pedagógico...");
        const cargoProcessoExistente = await this._cargoDAO.findByField("nomeCargo", Cargos_1.CARGO_PROCESSO_PEDAGOGICO);
        let idCargoProcesso;
        if (cargoProcessoExistente && cargoProcessoExistente.length > 0) {
            idCargoProcesso = cargoProcessoExistente[0].idCargo;
            console.log(`🔍 Cargo "${Cargos_1.CARGO_PROCESSO_PEDAGOGICO}" já existe com ID: ${idCargoProcesso}`);
        }
        else {
            const cargoProcesso = new Cargo_1.Cargo();
            cargoProcesso.nomeCargo = Cargos_1.CARGO_PROCESSO_PEDAGOGICO;
            const cargoCriado = await this._cargoDAO.create(cargoProcesso, funcionarioSistema);
            idCargoProcesso = cargoCriado.idCargo;
            console.log(`🆕 Cargo "${Cargos_1.CARGO_PROCESSO_PEDAGOGICO}" criado com ID: ${idCargoProcesso}`);
        }
        const adminName = process.env.DEFAULT_ADMIN_NAME || "Hélio Esperidião";
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "helioesperidiao@gmail.com";
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "@Helio123456";
        const adminValeTransporte = parseInt(process.env.DEFAULT_ADMIN_VALE_TRANSPORTE || "0", 10);
        console.log(`👤 Criando usuário padrão: ${adminName} (${adminEmail})`);
        const funcionarioPadrao = new Funcionario_1.Funcionario();
        funcionarioPadrao.nomeFuncionario = adminName;
        funcionarioPadrao.email = adminEmail;
        funcionarioPadrao.senha = await bcrypt_1.default.hash(adminPassword, 12);
        funcionarioPadrao.recebeValeTransporte = adminValeTransporte;
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = idCargoProcesso;
        funcionarioPadrao.cargo = cargo;
        funcionarioPadrao.marcarCriadoPor(funcionarioSistema.idFuncionario);
        const usuarioCriado = await this._funcionarioDAO.create(funcionarioPadrao, funcionarioPadrao);
        console.log(`✅ Usuário padrão criado com ID: ${usuarioCriado.idFuncionario}`);
        const cargoInspetorExistente = await this._cargoDAO.findByField("nomeCargo", Cargos_1.CARGO_INSPETOR);
        if (!cargoInspetorExistente || cargoInspetorExistente.length === 0) {
            const cargoInspetor = new Cargo_1.Cargo();
            cargoInspetor.nomeCargo = Cargos_1.CARGO_INSPETOR;
            await this._cargoDAO.create(cargoInspetor, usuarioCriado);
            console.log(`🆕 Cargo "${Cargos_1.CARGO_INSPETOR}" criado.`);
        }
        console.log("✅ Inicialização concluída.");
        return usuarioCriado;
    };
    create = async (funcionario, funcionarioLogado) => {
        console.log("🟣 FuncionarioService.create()");
        const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "O cargo informado não existe");
        }
        if (!(0, Cargos_1.cargoAceito)(cargoExiste[0].nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(400, "Cargo inválido", {
                message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
            });
        }
        const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Já existe um funcionário com este email");
        }
        const senhaHash = await bcrypt_1.default.hash(funcionario.senha, 12);
        funcionario.senha = senhaHash;
        funcionario.marcarCriadoPor(funcionarioLogado.idFuncionario);
        const novoFuncionario = await this._funcionarioDAO.create(funcionario, funcionarioLogado);
        return novoFuncionario;
    };
    loginFuncionario = async (funcionario) => {
        console.log("🟣 FuncionarioService.loginFuncionario()");
        console.log("🔍 Email recebido:", funcionario.email);
        console.log("🔍 Senha recebida (tamanho):", funcionario.senha ? funcionario.senha.length : "vazia");
        const funcionarioBanco = await this._funcionarioDAO.findByEmail(funcionario.email);
        if (!funcionarioBanco) {
            console.log("❌ Funcionário não encontrado com email:", funcionario.email);
            throw new ErrorResponse_1.ErrorResponse(401, "Usuário ou senha inválidos");
        }
        if (!(0, Cargos_1.cargoAceito)(funcionarioBanco.cargo.nomeCargo)) {
            throw new ErrorResponse_1.ErrorResponse(401, "Usuário ou senha inválidos");
        }
        console.log("🔍 Hash armazenado (primeiros 10 caracteres):", funcionarioBanco.senha.substring(0, 10));
        const senhaValida = await bcrypt_1.default.compare(funcionario.senha, funcionarioBanco.senha);
        console.log("🔍 Senha válida?", senhaValida);
        if (!senhaValida) {
            throw new ErrorResponse_1.ErrorResponse(401, "Usuário ou senha inválidos");
        }
        const jwt = new MeuTokenJWT_1.MeuTokenJWT();
        const token = jwt.gerarToken(funcionarioBanco);
        return { user: funcionarioBanco, token };
    };
    findAll = async (_funcionarioLogado) => {
        console.log("🟣 FuncionarioService.findAll()");
        return await this._funcionarioDAO.findAll();
    };
    findById = async (idFuncionario, _funcionarioLogado) => {
        const funcionario = await this._funcionarioDAO.findById(idFuncionario);
        if (!funcionario) {
            throw new ErrorResponse_1.ErrorResponse(404, "Funcionário não encontrado");
        }
        return funcionario;
    };
    updateFuncionario = async (funcionario, funcionarioLogado) => {
        console.log(`🟣 FuncionarioService.updateFuncionario(${funcionario.idFuncionario})`);
        if (funcionario.email) {
            const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
            if (emailExiste && emailExiste.length > 0 && emailExiste[0].idFuncionario !== funcionario.idFuncionario) {
                throw new ErrorResponse_1.ErrorResponse(400, "Já existe um funcionário com este email");
            }
        }
        if (funcionario.cargo?.idCargo) {
            const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
            if (!cargoExiste || cargoExiste.length === 0) {
                throw new ErrorResponse_1.ErrorResponse(400, "O cargo informado não existe");
            }
            if (!(0, Cargos_1.cargoAceito)(cargoExiste[0].nomeCargo)) {
                throw new ErrorResponse_1.ErrorResponse(400, "Cargo inválido", {
                    message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
                });
            }
        }
        funcionario.marcarAlteradoPor(funcionarioLogado.idFuncionario);
        return await this._funcionarioDAO.update(funcionario, funcionarioLogado);
    };
    deleteFuncionario = async (funcionario, funcionarioLogado) => {
        funcionario.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        return await this._funcionarioDAO.delete(funcionario, funcionarioLogado);
    };
    count = async (_funcionarioLogado) => {
        console.log("🟣 FuncionarioService.count()");
        return await this._funcionarioDAO.count();
    };
    countByCargoId = async (cargoId, _funcionarioLogado) => {
        console.log(`🟣 FuncionarioService.countByCargoId(${cargoId})`);
        return await this._funcionarioDAO.countByCargoId(cargoId);
    };
}
exports.FuncionarioService = FuncionarioService;
//# sourceMappingURL=FuncionarioService.js.map