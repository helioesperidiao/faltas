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
    initializeDefaultAdmin = async (): Promise<void> => {
        console.log("🟣 FuncionarioService.initializeDefaultAdmin()");

        const funcionarios = await this._funcionarioDAO.findAll();
        if (funcionarios && funcionarios.length > 0) {
            console.log("✅ Já existem funcionários cadastrados. Pulando criação do admin padrão.");
            return;
        }

        // Busca ou cria cargo "Administrador"
        const cargoAdmin = await this._cargoDAO.findByField("nomeCargo", "Administrador");
        let cargoId: string;
        if (cargoAdmin && cargoAdmin.length > 0) {
            cargoId = cargoAdmin[0].idCargo;
            console.log(`🔍 Cargo "Administrador" encontrado com ID: ${cargoId}`);
        } else {
            const novoCargo = new Cargo();
            novoCargo.nomeCargo = "Administrador";
            cargoId = await this._cargoDAO.create(novoCargo);
            console.log(`🆕 Cargo "Administrador" criado com ID: ${cargoId}`);
        }

        const adminData = {
            nomeFuncionario: "Hélio Esperidião",
            email: "helioesperidiao@gmail.com",
            senha: "@Helio123456",
            recebeValeTransporte: 0,
            cargo: { idCargo: cargoId }
        };

        const novoAdmin = await this.create(adminData);
        console.log(`✅ Administrador padrão criado com ID: ${novoAdmin.idFuncionario}`);
    };

    /**
     * Cria um novo funcionário.
     * Validações: cargo existe, email não duplicado, senha atende requisitos.
     */
    create = async (jsonFuncionario: any): Promise<Funcionario> => {
        console.log("🟣 FuncionarioService.create()");

        // 1. Valida campos obrigatórios
        if (!jsonFuncionario.nomeFuncionario) throw new ErrorResponse(400, "Nome do funcionário é obrigatório");
        if (!jsonFuncionario.email) throw new ErrorResponse(400, "Email é obrigatório");
        if (!jsonFuncionario.senha) throw new ErrorResponse(400, "Senha é obrigatória");
        if (!jsonFuncionario.cargo?.idCargo) throw new ErrorResponse(400, "Cargo é obrigatório");

        // 2. Valida formato do ID do cargo
        this.validateObjectId(jsonFuncionario.cargo.idCargo, "cargo.idCargo");

        // 3. Verifica se o cargo existe
        const cargoExiste = await this._cargoDAO.findByField("_id", jsonFuncionario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse(400, "O cargo informado não existe");
        }

        // 4. Verifica se o email já está cadastrado
        const emailExiste = await this._funcionarioDAO.findByField("email", jsonFuncionario.email);
        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse(400, "Já existe um funcionário com este email");
        }

        // 5. Cria objeto Funcionario e aplica regras de domínio (via setters)
        const objCargo = new Cargo();
        objCargo.idCargo = jsonFuncionario.cargo.idCargo;

        const objFuncionario = new Funcionario();
        objFuncionario.nomeFuncionario = jsonFuncionario.nomeFuncionario;
        objFuncionario.email = jsonFuncionario.email;
        objFuncionario.senha = jsonFuncionario.senha;
        objFuncionario.recebeValeTransporte = jsonFuncionario.recebeValeTransporte ?? 0;
        objFuncionario.cargo = objCargo;

        // 6. Criptografa a senha (regra de negócio)
        const senhaHash = await bcrypt.hash(objFuncionario.senha, 12);
        objFuncionario.senha = senhaHash;

        // 7. Persiste no banco via DAO (apenas insert)
        const id = await this._funcionarioDAO.create(objFuncionario);
        objFuncionario.idFuncionario = id;

        return objFuncionario;
    };

    /**
     * Realiza o login de um funcionário.
     */
    loginFuncionario = async (jsonFuncionario: any): Promise<{ user: any; token: string }> => {
        console.log("🟣 FuncionarioService.loginFuncionario()");

        const { email, senha } = jsonFuncionario;
        if (!email || !senha) {
            throw new ErrorResponse(400, "Email e senha são obrigatórios");
        }

        // Busca o funcionário pelo email (inclui senha hash)
        const funcionarioRaw = await this._funcionarioDAO.findRawByEmail(email);
        if (!funcionarioRaw) {
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Compara a senha fornecida com o hash armazenado
        const senhaValida = await bcrypt.compare(senha, funcionarioRaw.senha);
        if (!senhaValida) {
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Converte o documento bruto para objeto Funcionario (sem a senha)
        const funcionario = this._funcionarioDAO['toFuncionario'](funcionarioRaw);

        // Gera token JWT
        const jwt = new MeuTokenJWT();
        const user = {
            funcionario: {
                email: funcionario.email,
                role: funcionario.cargo?.nomeCargo || null,
                name: funcionario.nomeFuncionario || null,
                idFuncionario: funcionario.idFuncionario
            }
        };

        return { user, token: jwt.gerarToken(user.funcionario) };
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
    updateFuncionario = async (idFuncionario: string, requestBody: any): Promise<boolean> => {
        console.log(`🟣 FuncionarioService.updateFuncionario(${idFuncionario})`);
        this.validateObjectId(idFuncionario, "idFuncionario");

        const jsonFuncionario = requestBody.funcionario;
        if (!jsonFuncionario) {
            throw new ErrorResponse(400, "Dados do funcionário são obrigatórios");
        }

        // Validações de negócio
        if (jsonFuncionario.email) {
            const emailExiste = await this._funcionarioDAO.findByField("email", jsonFuncionario.email);
            if (emailExiste && emailExiste.length > 0 && emailExiste[0].idFuncionario !== idFuncionario) {
                throw new ErrorResponse(400, "Já existe um funcionário com este email");
            }
        }

        if (jsonFuncionario.cargo?.idCargo) {
            this.validateObjectId(jsonFuncionario.cargo.idCargo, "cargo.idCargo");
            const cargoExiste = await this._cargoDAO.findByField("_id", jsonFuncionario.cargo.idCargo);
            if (!cargoExiste || cargoExiste.length === 0) {
                throw new ErrorResponse(400, "O cargo informado não existe");
            }
        }

        // Monta objeto de atualização
        const updateData: any = {
            nomeFuncionario: jsonFuncionario.nomeFuncionario,
            email: jsonFuncionario.email,
            recebeValeTransporte: jsonFuncionario.recebeValeTransporte,
        };

        if (jsonFuncionario.senha) {
            const senhaHash = await bcrypt.hash(jsonFuncionario.senha, 12);
            updateData.senha = senhaHash;
        }

        if (jsonFuncionario.cargo?.idCargo) {
            updateData.cargoId = new ObjectId(jsonFuncionario.cargo.idCargo);
        }

        // Remove undefined para não sobrescrever
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        // Atualiza no banco
        return await this._funcionarioDAO.update(idFuncionario, updateData);
    };

    /**
     * Exclui um funcionário.
     */
    deleteFuncionario = async (idFuncionario: string): Promise<boolean> => {
        this.validateObjectId(idFuncionario, "idFuncionario");
        return await this._funcionarioDAO.delete(idFuncionario);
    };
}