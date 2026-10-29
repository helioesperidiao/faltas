import bcrypt from "bcrypt";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
import { MeuTokenJWT } from "../http/MeuTokenJWT";
import { cargoAceito, CARGO_INSPETOR, CARGO_PROCESSO_PEDAGOGICO } from "@/constants/Cargos";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioService");

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
        this._funcionarioDAO = funcionarioDAODependency;
        this._cargoDAO = cargoDAODependency;
        // Inicializa o administrador padrão se não houver funcionários.
        // O Server também chama initializeDefaultAdmin() no boot; a dupla chamada
        // é idempotente (verifica count() > 0 antes de criar).
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
        log.debug("initializeDefaultAdmin()");

        // 1. Verifica se já existem funcionários
        const totalFuncionarios = await this._funcionarioDAO.count();
        if (totalFuncionarios > 0) {
            log.info("já existem funcionários cadastrados; pulando criação do admin padrão");
            return;
        }

        // 2. Cria um funcionário "Sistema" para registrar a auditoria na criação do cargo Admin
        const funcionarioSistema = new Funcionario();
        funcionarioSistema.idFuncionario = "000000000000000000000000";
        funcionarioSistema.nomeFuncionario = "Sistema";
        funcionarioSistema.email = "sistema@empresa.com";

        // 3. Cria o cargo Processo Pedagógico (se não existir)
        log.debug("criando/verificando cargo Processo Pedagógico");
        const cargoProcessoExistente = await this._cargoDAO.findByField("nomeCargo", CARGO_PROCESSO_PEDAGOGICO);
        let idCargoProcesso: string;
        if (cargoProcessoExistente && cargoProcessoExistente.length > 0) {
            idCargoProcesso = cargoProcessoExistente[0].idCargo;
            log.debug("cargo já existe", { nomeCargo: CARGO_PROCESSO_PEDAGOGICO, idCargo: idCargoProcesso });
        } else {
            const cargoProcesso = new Cargo();
            cargoProcesso.nomeCargo = CARGO_PROCESSO_PEDAGOGICO;
            const cargoCriado = await this._cargoDAO.create(cargoProcesso, funcionarioSistema);
            idCargoProcesso = cargoCriado.idCargo;
            log.info("cargo criado", { nomeCargo: CARGO_PROCESSO_PEDAGOGICO, idCargo: idCargoProcesso });
        }

        // 4. Carrega dados do administrador a partir das variáveis de ambiente (ou fallback)
        const adminName = process.env.DEFAULT_ADMIN_NAME || "Hélio Esperidião";
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "helioesperidiao@gmail.com";
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "@Helio123456";
        const adminValeTransporte = parseInt(process.env.DEFAULT_ADMIN_VALE_TRANSPORTE || "0", 10);

        // 5. Cria o usuário padrão com cargo Processo Pedagógico
        log.debug("criando usuário padrão", { nomeFuncionario: adminName, email: adminEmail });
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
        log.info("usuário padrão criado", { idFuncionario: usuarioCriado.idFuncionario });

        // 6. Cria o cargo Inspetor
        const cargoInspetorExistente = await this._cargoDAO.findByField("nomeCargo", CARGO_INSPETOR);
        if (!cargoInspetorExistente || cargoInspetorExistente.length === 0) {
            const cargoInspetor = new Cargo();
            cargoInspetor.nomeCargo = CARGO_INSPETOR;
            await this._cargoDAO.create(cargoInspetor, usuarioCriado);
            log.info("cargo criado", { nomeCargo: CARGO_INSPETOR });
        }

        log.info("inicialização concluída");
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
        log.debug("create()", { email: funcionario.email });

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
        log.info("funcionário criado", {
            idFuncionario: novoFuncionario.idFuncionario,
            email: novoFuncionario.email,
            cargo: novoFuncionario.cargo.nomeCargo,
            criadoPor: funcionarioLogado.email,
        });
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
        log.debug("loginFuncionario()", { email: funcionario.email });

        // Busca o funcionário pelo email
        const funcionarioBanco = await this._funcionarioDAO.findByEmail(funcionario.email);
        if (!funcionarioBanco) {
            log.warn("login falhou", { email: funcionario.email, motivo: "email não encontrado" });
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        if (!cargoAceito(funcionarioBanco.cargo.nomeCargo)) {
            log.warn("login falhou", { email: funcionario.email, motivo: "cargo não aceito", cargo: funcionarioBanco.cargo.nomeCargo });
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Compara a senha fornecida com o hash armazenado
        const senhaValida = await bcrypt.compare(funcionario.senha, funcionarioBanco.senha);
        if (!senhaValida) {
            log.warn("login falhou", { email: funcionario.email, motivo: "senha inválida" });
            throw new ErrorResponse(401, "Usuário ou senha inválidos");
        }

        // Gera token JWT
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(funcionarioBanco);
        log.info("login efetuado", { idFuncionario: funcionarioBanco.idFuncionario, cargo: funcionarioBanco.cargo.nomeCargo });

        return { user: funcionarioBanco, token };
    };

    /**
     * Retorna todos os funcionários cadastrados.
     * 
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado, mantido por consistência).
     * @returns Lista de funcionários.
     */
    findAll = async (_funcionarioLogado: Funcionario): Promise<Funcionario[]> => {
        log.debug("findAll()");
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
        log.debug("findById()", { idFuncionario });
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
        log.debug("updateFuncionario()", { idFuncionario: funcionario.idFuncionario });

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
        const atualizou = await this._funcionarioDAO.update(funcionario, funcionarioLogado);
        if (atualizou) {
            log.info("funcionário atualizado", {
                idFuncionario: funcionario.idFuncionario,
                atualizadoPor: funcionarioLogado.email,
            });
        }
        return atualizou;
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
        log.debug("deleteFuncionario()", { idFuncionario: funcionario.idFuncionario });

        // Registra auditoria: quem deletou (soft delete)
        funcionario.marcarDeletadoPor(funcionarioLogado.idFuncionario);
        const excluiu = await this._funcionarioDAO.delete(funcionario, funcionarioLogado);
        if (excluiu) {
            log.info("funcionário excluído", {
                idFuncionario: funcionario.idFuncionario,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    /**
     * Retorna a quantidade total de funcionários cadastrados.
     * 
     * @param _funcionarioLogado - Funcionário autenticado (não utilizado).
     * @returns Número total de funcionários.
     */
    count = async (_funcionarioLogado: Funcionario): Promise<number> => {
        log.debug("count()");
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
        log.debug("countByCargoId()", { cargoId });
        return await this._funcionarioDAO.countByCargoId(cargoId);
    };
}