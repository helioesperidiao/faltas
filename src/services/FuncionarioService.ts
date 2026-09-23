import bcrypt from "bcrypt";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
import { MeuTokenJWT } from "../http/MeuTokenJWT";
import { cargoAceito, CARGO_INSPETOR, CARGO_PROCESSO_PEDAGOGICO } from "@/constants/Cargos";

/**
 * Serviço responsável pelas regras de negócio da entidade Funcionario.
 * 
 * Gerencia operações CRUD, autenticação (login), contagens e inicialização
 * do administrador padrão. Utiliza injeção de dependência para acessar
 * os DAOs de Funcionario e Cargo.
 * 
 * @example
 * const funcionarioService = new FuncionarioService(funcionarioDAO, cargoDAO);
 * const funcionario = await funcionarioService.create(dados, usuarioLogado);
 */
export class FuncionarioService {
    private _funcionarioDAO: FuncionarioDAO;
    private _cargoDAO: CargoDAO;

    /**
     * Construtor do FuncionarioService.
     * 
     * @param funcionarioDAODependency - Instância de FuncionarioDAO injetada.
     * @param cargoDAODependency - Instância de CargoDAO injetada.
     */
    constructor(funcionarioDAODependency: FuncionarioDAO, cargoDAODependency: CargoDAO) {
        console.log("⬆️  FuncionarioService.constructor()");
        this._funcionarioDAO = funcionarioDAODependency;
        this._cargoDAO = cargoDAODependency;
        // Inicializa o administrador padrão se não houver funcionários
        this.initializeDefaultAdmin();
    }

    /**
     * Inicializa o usuário padrão e os dois cargos aceitos.
     *
     * 🔹 Cria o cargo "Processo Pedagógico" (usando um funcionário sistema para auditoria).
     * 🔹 Cria o usuário padrão com as credenciais do .env.
     * 🔹 Cria também o cargo "Inspetor".
     *
     * @returns O Funcionario administrador criado, ou void se já houver funcionários.
     */
    initializeDefaultAdmin = async (): Promise<Funcionario | void> => {
        console.log("🟣 FuncionarioService.initializeDefaultAdmin()");

        // 1. Verifica se já existem funcionários
        const totalFuncionarios = await this._funcionarioDAO.count();
        if (totalFuncionarios > 0) {
            console.log("✅ Já existem funcionários cadastrados. Pulando criação do admin padrão.");
            return;
        }

        // 2. Cria um funcionário "Sistema" para registrar a auditoria na criação do cargo Admin
        const funcionarioSistema = new Funcionario();
        funcionarioSistema.idFuncionario = "000000000000000000000000";
        funcionarioSistema.nomeFuncionario = "Sistema";
        funcionarioSistema.email = "sistema@empresa.com";

        // 3. Cria o cargo Processo Pedagógico (se não existir)
        console.log("🔧 Criando/verificando cargo Processo Pedagógico...");
        const cargoProcessoExistente = await this._cargoDAO.findByField("nomeCargo", CARGO_PROCESSO_PEDAGOGICO);
        let idCargoProcesso: string;
        if (cargoProcessoExistente && cargoProcessoExistente.length > 0) {
            idCargoProcesso = cargoProcessoExistente[0].idCargo;
            console.log(`🔍 Cargo "${CARGO_PROCESSO_PEDAGOGICO}" já existe com ID: ${idCargoProcesso}`);
        } else {
            const cargoProcesso = new Cargo();
            cargoProcesso.nomeCargo = CARGO_PROCESSO_PEDAGOGICO;
            const cargoCriado = await this._cargoDAO.create(cargoProcesso, funcionarioSistema);
            idCargoProcesso = cargoCriado.idCargo;
            console.log(`🆕 Cargo "${CARGO_PROCESSO_PEDAGOGICO}" criado com ID: ${idCargoProcesso}`);
        }

        // 4. Carrega dados do administrador a partir das variáveis de ambiente (ou fallback)
        const adminName = process.env.DEFAULT_ADMIN_NAME || "Hélio Esperidião";
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "helioesperidiao@gmail.com";
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "@Helio123456";
        const adminValeTransporte = parseInt(process.env.DEFAULT_ADMIN_VALE_TRANSPORTE || "0", 10);

        // 5. Cria o usuário padrão com cargo Processo Pedagógico
        console.log(`👤 Criando usuário padrão: ${adminName} (${adminEmail})`);
        const funcionarioPadrao = new Funcionario();
        funcionarioPadrao.nomeFuncionario = adminName;
        funcionarioPadrao.email = adminEmail;
        funcionarioPadrao.senha = await bcrypt.hash(adminPassword, 12);
        funcionarioPadrao.recebeValeTransporte = adminValeTransporte;

        const cargo = new Cargo();
        cargo.idCargo = idCargoProcesso;
        funcionarioPadrao.cargo = cargo;

        // Marca a auditoria do usuário padrão: criado pelo sistema (ID simbólico)
        funcionarioPadrao.marcarCriadoPor(funcionarioSistema.idFuncionario);

        const usuarioCriado = await this._funcionarioDAO.create(funcionarioPadrao, funcionarioPadrao);
        console.log(`✅ Usuário padrão criado com ID: ${usuarioCriado.idFuncionario}`);

        // 6. Cria o cargo Inspetor
        const cargoInspetorExistente = await this._cargoDAO.findByField("nomeCargo", CARGO_INSPETOR);
        if (!cargoInspetorExistente || cargoInspetorExistente.length === 0) {
            const cargoInspetor = new Cargo();
            cargoInspetor.nomeCargo = CARGO_INSPETOR;
            await this._cargoDAO.create(cargoInspetor, usuarioCriado);
            console.log(`🆕 Cargo "${CARGO_INSPETOR}" criado.`);
        }

        console.log("✅ Inicialização concluída.");
        return usuarioCriado;
    };

    /**
     * Cria um novo funcionário.
     * 
     * 🔹 Regra de negócio: verifica se o cargo existe.
     * 🔹 Regra de negócio: verifica se o email já está cadastrado.
     * 🔹 A senha é hashada com bcrypt antes da persistência.
     * 🔹 Registra auditoria: quem criou (funcionário logado).
     * 
     * @param funcionario - Objeto Funcionario a ser criado.
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns O funcionário criado com o ID preenchido.
     * @throws {ErrorResponse} Se o cargo não existir ou se o email já estiver em uso.
     */
    create = async (funcionario: Funcionario, funcionarioLogado: Funcionario): Promise<Funcionario> => {
        console.log("🟣 FuncionarioService.create()");

        // Verifica se o cargo existe
        const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
        if (!cargoExiste || cargoExiste.length === 0) {
            throw new ErrorResponse(400, "O cargo informado não existe");
        }
        if (!cargoAceito(cargoExiste[0].nomeCargo)) {
            throw new ErrorResponse(400, "Cargo inválido", {
                message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
            });
        }

        // Verifica se o email já está cadastrado
        const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
        if (emailExiste && emailExiste.length > 0) {
            throw new ErrorResponse(400, "Já existe um funcionário com este email");
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(funcionario.senha, 12);
        funcionario.senha = senhaHash;

        // Registra auditoria: quem criou
        funcionario.marcarCriadoPor(funcionarioLogado.idFuncionario);

        // Persiste no banco
        const novoFuncionario = await this._funcionarioDAO.create(funcionario, funcionarioLogado);
        return novoFuncionario;
    };

    /**
     * Realiza a autenticação de um funcionário.
     * 
     * 🔹 Busca o funcionário pelo email.
     * 🔹 Compara a senha fornecida com o hash armazenado.
     * 🔹 Gera um token JWT se as credenciais forem válidas.
     * 
     * @param funcionario - Objeto com email e senha (em texto plano).
     * @returns Objeto contendo o funcionário autenticado e o token JWT.
     * @throws {ErrorResponse} Se o email não existir ou a senha for inválida.
     */
    loginFuncionario = async (funcionario: Funcionario): Promise<{ user: Funcionario; token: string }> => {
        console.log("🟣 FuncionarioService.loginFuncionario()");

        console.log("🔍 Email recebido:", funcionario.email);
        console.log("🔍 Senha recebida (tamanho):", funcionario.senha ? funcionario.senha.length : "vazia");

        // Busca o funcionário pelo email
        const funcionarioBanco = await this._funcionarioDAO.findByEmail(funcionario.email);
        if (!funcionarioBanco) {
            console.log("❌ Funcionário não encontrado com email:", funcionario.email);
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        if (!cargoAceito(funcionarioBanco.cargo.nomeCargo)) {
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        console.log("🔍 Hash armazenado (primeiros 10 caracteres):", funcionarioBanco.senha.substring(0, 10));

        // Compara a senha fornecida com o hash armazenado
        const senhaValida = await bcrypt.compare(funcionario.senha, funcionarioBanco.senha);
        console.log("🔍 Senha válida?", senhaValida);

        if (!senhaValida) {
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Gera token JWT
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(funcionarioBanco);

        return { user: funcionarioBanco, token };
    };

    /**
     * Retorna todos os funcionários cadastrados.
     * 
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns Lista de funcionários.
     */
    findAll = async (_funcionarioLogado: Funcionario): Promise<Funcionario[]> => {
        console.log("🟣 FuncionarioService.findAll()");
        return await this._funcionarioDAO.findAll();
    };

    /**
     * Busca um funcionário pelo ID.
     * 
     * @param idFuncionario - ID do funcionário (string hexadecimal).
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado).
     * @returns O funcionário encontrado.
     * @throws {ErrorResponse} Se o funcionário não existir.
     */
    findById = async (idFuncionario: string, _funcionarioLogado: Funcionario): Promise<Funcionario> => {
        const funcionario = await this._funcionarioDAO.findById(idFuncionario);
        if (!funcionario) {
            throw new ErrorResponse(404, "Funcionário não encontrado");
        }
        return funcionario;
    };

    /**
     * Atualiza os dados de um funcionário existente.
     * 
     * 🔹 Regra de negócio: se o email for alterado, verifica se já está em uso.
     * 🔹 Regra de negócio: se o cargo for alterado, verifica se ele existe.
     * 🔹 Registra auditoria: quem alterou (funcionário logado).
     * 
     * @param funcionario - Objeto com os dados atualizados (deve conter `idFuncionario`).
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns true se a atualização foi bem-sucedida, false caso contrário.
     * @throws {ErrorResponse} Se o email já estiver em uso ou o cargo não existir.
     */
    updateFuncionario = async (funcionario: Funcionario, funcionarioLogado: Funcionario): Promise<boolean> => {
        console.log(`🟣 FuncionarioService.updateFuncionario(${funcionario.idFuncionario})`);

        // Valida se o email já está em uso por outro funcionário
        if (funcionario.email) {
            const emailExiste = await this._funcionarioDAO.findByField("email", funcionario.email);
            if (emailExiste && emailExiste.length > 0 && emailExiste[0].idFuncionario !== funcionario.idFuncionario) {
                throw new ErrorResponse(400, "Já existe um funcionário com este email");
            }
        }

        // Valida se o cargo existe
        if (funcionario.cargo?.idCargo) {
            const cargoExiste = await this._cargoDAO.findByField("_id", funcionario.cargo.idCargo);
            if (!cargoExiste || cargoExiste.length === 0) {
                throw new ErrorResponse(400, "O cargo informado não existe");
            }
            if (!cargoAceito(cargoExiste[0].nomeCargo)) {
                throw new ErrorResponse(400, "Cargo inválido", {
                    message: "Os únicos cargos aceitos são Inspetor e Processo Pedagógico."
                });
            }
        }

        // Registra auditoria: quem alterou
        funcionario.marcarAlteradoPor(funcionarioLogado.idFuncionario);

        // Persiste a atualização
        return await this._funcionarioDAO.update(funcionario, funcionarioLogado);
    };

    /**
     * Remove um funcionário (soft delete) pelo ID.
     * 
     * 🔹 Marca o funcionário como deletado, registrando quem realizou a exclusão.
     * 
     * @param funcionario - Objeto Funcionario contendo o ID a ser removido.
     * @param funcionarioLogado - Funcionário autenticado que está realizando a operação.
     * @returns true se a exclusão foi bem-sucedida, false caso contrário.
     */
    deleteFuncionario = async (funcionario: Funcionario, funcionarioLogado: Funcionario): Promise<boolean> => {
        // Registra auditoria: quem deletou (soft delete)
        funcionario.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        return await this._funcionarioDAO.delete(funcionario, funcionarioLogado);
    };

    /**
     * Retorna a quantidade total de funcionários cadastrados.
     * 
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado).
     * @returns Número total de funcionários.
     */
    count = async (_funcionarioLogado: Funcionario): Promise<number> => {
        console.log("🟣 FuncionarioService.count()");
        return await this._funcionarioDAO.count();
    };

    /**
     * Retorna a quantidade de funcionários que possuem um determinado cargo.
     * 
     * @param cargoId - ID do cargo (string hexadecimal).
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado).
     * @returns Número de funcionários com o cargo informado.
     */
    countByCargoId = async (cargoId: string, _funcionarioLogado: Funcionario): Promise<number> => {
        console.log(`🟣 FuncionarioService.countByCargoId(${cargoId})`);
        return await this._funcionarioDAO.countByCargoId(cargoId);
    };
}
