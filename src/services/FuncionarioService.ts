import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
import { MeuTokenJWT } from "../http/MeuTokenJWT";

export class FuncionarioService {
    private _funcionarioDAO: FuncionarioDAO;
    private _cargoDAO: CargoDAO;

    constructor(funcionarioDAODependency: FuncionarioDAO, cargoDAODependency: CargoDAO) {
        console.log("⬆️  FuncionarioService.constructor()");
        this._funcionarioDAO = funcionarioDAODependency;
        this._cargoDAO = cargoDAODependency;
        this.initializeDefaultAdmin();
    }

    /**
     * Valida se uma string é um ObjectId válido (24 caracteres hex)
     */
    private validateObjectId(id: string, fieldName: string): void {
        if (!id) {
            throw new ErrorResponse(400, `O campo '${fieldName}' é obrigatório`);
        }
        if (!ObjectId.isValid(id)) {
            throw new ErrorResponse(400, `O campo '${fieldName}' possui formato inválido`);
        }
    }

    /**
     * Inicializa o administrador padrão se não houver funcionários.
     */
    initializeDefaultAdmin = async (): Promise<Funcionario | void> => {
        console.log("🟣 FuncionarioService.initializeDefaultAdmin()");

        const funcionarios = await this._funcionarioDAO.findAll();
        if (funcionarios && funcionarios.length > 0) {
            console.log("✅ Já existem funcionários cadastrados. Pulando criação do admin padrão.");
            return;
        }

        const cargoAdmin = await this._cargoDAO.findByField("nomeCargo", "Administrador");
        let cargoId: string;
        if (cargoAdmin && cargoAdmin.length > 0) {
            cargoId = cargoAdmin[0].idCargo;
            console.log(`🔍 Cargo "Administrador" encontrado com ID: ${cargoId}`);
        } else {
            const cargo = new Cargo();
            cargo.nomeCargo = "Administrador";
            const novoCargo = await this._cargoDAO.create(cargo);
            cargoId = novoCargo.idCargo;
            console.log(`🆕 Cargo "Administrador" criado com ID: ${cargoId}`);
        }

        const funcionarioAdmin = new Funcionario();
        funcionarioAdmin.nomeFuncionario = "Hélio Esperidião";
        funcionarioAdmin.email = "helioesperidiao@gmail.com";
        funcionarioAdmin.senha = "@Helio123456";
        funcionarioAdmin.recebeValeTransporte = 0;

        // Cria e atribui o cargo
        const cargo = new Cargo();
        cargo.idCargo = cargoId;
        funcionarioAdmin.cargo = cargo;

        const novoAdmin = await this.create(funcionarioAdmin);
        console.log(`✅ Administrador padrão criado com ID: ${novoAdmin.idFuncionario}`);

        return novoAdmin;
    };
    /**
     * Cria um novo funcionário.
     * Validações: cargo existe, email não duplicado, senha atende requisitos.
     */
    create = async (funcinario: Funcionario): Promise<Funcionario> => {
        console.log("🟣 FuncionarioService.create()");

        const cargoExiste = await this._cargoDAO.findByField("_id", funcinario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse(400, "O cargo informado não existe");
        }


        const emailExiste = await this._funcionarioDAO.findByField("email", funcinario.email);

        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse(400, "Já existe um funcionário com este email");
        }




        const senhaHash = await bcrypt.hash(funcinario.senha, 12);
        funcinario.senha = senhaHash;


        const novoFuncinoario = await this._funcionarioDAO.create(funcinario);


        return novoFuncinoario;
    };

    /**
     * Realiza o login de um funcionário.
     */
    loginFuncionario = async (funcionario: Funcionario): Promise<{ user: Funcionario; token: string }> => {
        console.log("🟣 FuncionarioService.loginFuncionario()");

        // Logs para depuração
        console.log("🔍 Email recebido:", funcionario.email);
        console.log("🔍 Senha recebida (tamanho):", funcionario.senha ? funcionario.senha.length : "vazia");

        // Busca o funcionário pelo email
        const funcionarioBanco = await this._funcionarioDAO.findByEmail(funcionario.email);
        if (!funcionarioBanco) {
            console.log("❌ Funcionário não encontrado com email:", funcionario.email);
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Log do hash armazenado
        console.log("🔍 Hash armazenado (primeiros 10 caracteres):", funcionarioBanco.senha.substring(0, 10));

        // Compara a senha fornecida com o hash armazenado
        const senhaValida = await bcrypt.compare(funcionario.senha, funcionarioBanco.senha);
        console.log("🔍 Senha válida?", senhaValida);

        if (!senhaValida) {
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Gera token JWT com os dados completos do funcionário do banco
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(funcionarioBanco);

        return { user: funcionarioBanco, token };
    };

    /**
     * Retorna todos os funcionários.
     */
    findAll = async (): Promise<Funcionario[]> => {
        console.log("🟣 FuncionarioService.findAll()");
        return this._funcionarioDAO.findAll();
    };

    /**
     * Retorna um funcionário pelo ID.
     */
    findById = async (idFuncionario: string): Promise<Funcionario> => {
        this.validateObjectId(idFuncionario, "idFuncionario");
        const funcionario = await this._funcionarioDAO.findById(idFuncionario);
        if (!funcionario) {
            throw new ErrorResponse(404, "Funcionário não encontrado");
        }
        return funcionario;
    };

    /**
     * Atualiza um funcionário existente.
     * Validações: cargo existe, email não duplicado (se alterado), senha opcional.
     */
    updateFuncionario = async (funcionario: Funcionario): Promise<boolean> => {
        console.log(`🟣 FuncionarioService.updateFuncionario(${funcionario.idFuncionario})`);


        // Validações de negócio
        if (funcionario.email) {
            const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
            if (emailExiste && emailExiste.length > 0 && emailExiste[0].idFuncionario !== funcionario.idFuncionario) {
                throw new ErrorResponse(400, "Já existe um funcionário com este email");
            }
        }

        if (funcionario.cargo.idCargo) {

            const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
            if (!cargoExiste || cargoExiste.length === 0) {
                throw new ErrorResponse(400, "O cargo informado não existe");
            }
        }

        // Atualiza no banco
        return await this._funcionarioDAO.update(funcionario);
    };

    /**
     * Exclui um funcionário.
     */
    deleteFuncionario = async (funcionario: Funcionario): Promise<boolean> => {

        return await this._funcionarioDAO.delete(funcionario);
    };
}