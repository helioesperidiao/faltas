import { ObjectId } from "mongodb";
import { Cargo } from "./Cargo";

/**
 * Representa a entidade Funcionario do sistema.
 * 
 * Objetivo:
 * - Encapsular os dados de um funcionário.
 * - Garantir integridade dos atributos via getters e setters.
 * - Associar corretamente um funcionário a um Cargo.
 * 
 * @example
 * const funcionario = new Funcionario();
 * funcionario.nomeFuncionario = "Ana Silva";
 * funcionario.email = "ana@empresa.com";
 * funcionario.senha = "Senha@123";
 * funcionario.recebeValeTransporte = 1;
 * 
 * const cargo = new Cargo();
 * cargo.idCargo = "67a1b2c3d4e5f6789a0b1c2d";
 * funcionario.cargo = cargo;
 */
export class Funcionario {
    private _idFuncionario: string = '';
    private _cargo!: Cargo;
    private _nomeFuncionario: string = '';
    private _email: string = '';
    private _senha: string = '';
    private _recebeValeTransporte: number = 0; // 0 = não, 1 = sim

    /**
     * Construtor da classe Funcionario.
     * Inicializa o cargo com uma nova instância de Cargo.
     */
    constructor() {
        this._cargo = new Cargo();
        console.log("⬆️  Funcionario.constructor()");
    }

    // ======================== GETTERS E SETTERS ========================

    /**
     * Retorna o ID do funcionário.
     * @returns {string} ID no formato hexadecimal (ObjectId).
     */
    get idFuncionario(): string {
        return this._idFuncionario;
    }

    /**
     * Define o ID do funcionário.
     * 
     * 🔹 Regra de domínio: deve ser um ObjectId válido do MongoDB (24 caracteres hex).
     * 
     * @param {string} value - ID do funcionário.
     * @throws {Error} Se o valor for vazio ou não for um ObjectId válido.
     * 
     * @example
     * funcionario.idFuncionario = "67a1b2c3d4e5f6789a0b1c2d"; // ✅
     * funcionario.idFuncionario = "123"; // ❌ (lança erro)
     */
    set idFuncionario(value: string) {
        if (!value) {
            throw new Error("idFuncionario é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idFuncionario inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idFuncionario = value;
    }

    /**
     * Retorna o cargo associado ao funcionário.
     * @returns {Cargo} Instância de Cargo.
     */
    get cargo(): Cargo {
        return this._cargo;
    }

    /**
     * Define o cargo do funcionário.
     * 
     * 🔹 Regra de domínio: deve ser uma instância de Cargo.
     * 
     * @param {Cargo} value - Instância de Cargo.
     * @throws {Error} Se o valor não for uma instância de Cargo.
     * 
     * @example
     * const cargo = new Cargo();
     * funcionario.cargo = cargo; // ✅
     * funcionario.cargo = null;  // ❌
     */
    set cargo(value: Cargo) {
        if (!(value instanceof Cargo)) {
            throw new Error("cargo deve ser uma instância válida de Cargo.");
        }
        this._cargo = value;
    }

    /**
     * Retorna o nome do funcionário.
     * @returns {string} Nome do funcionário.
     */
    get nomeFuncionario(): string {
        return this._nomeFuncionario;
    }

    /**
     * Define o nome do funcionário.
     * 
     * 🔹 Regra de domínio: deve ser uma string não vazia com pelo menos 3 caracteres.
     * 
     * @param {string} value - Nome do funcionário.
     * @throws {Error} Se não for string ou tiver menos de 3 caracteres.
     * 
     * @example
     * funcionario.nomeFuncionario = "João Silva"; // ✅
     * funcionario.nomeFuncionario = "Jo"; // ❌ (menos de 3 caracteres)
     */
    set nomeFuncionario(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeFuncionario deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeFuncionario deve ter pelo menos 3 caracteres.");
        }
        this._nomeFuncionario = nome;
    }

    /**
     * Retorna o email do funcionário.
     * @returns {string} Email.
     */
    get email(): string {
        return this._email;
    }

    /**
     * Define o email do funcionário.
     * 
     * 🔹 Regra de domínio: deve ser um email válido (formato).
     * 
     * @param {string} value - Email do funcionário.
     * @throws {Error} Se não for string, estiver vazio ou não seguir o formato.
     * 
     * @example
     * funcionario.email = "ana@empresa.com"; // ✅
     * funcionario.email = "email_invalido"; // ❌
     */
    set email(value: string) {
        if (typeof value !== "string") {
            throw new Error("email deve ser uma string.");
        }
        const emailTrimmed = value.trim();
        if (emailTrimmed === "") {
            throw new Error("email não pode ser vazio.");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            throw new Error("email em formato inválido.");
        }
        this._email = emailTrimmed;
    }

    /**
     * Retorna a senha do funcionário.
     * @returns {string} Senha (pode ser hash).
     */
    get senha(): string {
        return this._senha;
    }

    /**
     * Define a senha do funcionário.
     * 
     * 🔹 Nota: Este setter não realiza validações para permitir a atribuição
     * do hash gerado pelo bcrypt. As validações de força da senha devem ser
     * aplicadas na camada de serviço antes da criptografia.
     * 
     * @param {string} value - Senha (texto puro ou hash).
     * 
     * @example
     * // No Service (antes de salvar)
     * const hash = await bcrypt.hash(senha, 12);
     * funcionario.senha = hash; // ✅
     */
    set senha(value: string) {
        // Permite atribuição direta (sem validações)
        this._senha = value;
    }

    /**
     * Retorna se o funcionário recebe vale transporte.
     * @returns {number} 0 = não, 1 = sim.
     */
    get recebeValeTransporte(): number {
        return this._recebeValeTransporte;
    }

    /**
     * Define se o funcionário recebe vale transporte.
     * 
     * 🔹 Regra de domínio: deve ser 0 ou 1.
     * 
     * @param {number} value - 0 ou 1.
     * @throws {Error} Se o valor não for 0 ou 1.
     * 
     * @example
     * funcionario.recebeValeTransporte = 1; // ✅
     * funcionario.recebeValeTransporte = 2; // ❌
     */
    set recebeValeTransporte(value: number) {
        if (![0, 1].includes(value)) {
            throw new Error("recebeValeTransporte deve ser 0 ou 1.");
        }
        this._recebeValeTransporte = value;
    }

    // ======================== SERIALIZAÇÃO ========================

    /**
     * Controla a serialização para JSON.
     * 
     * Remove os underlines dos campos e inclui o cargo serializado.
     * 
     * @returns {Object} Objeto com os campos: idFuncionario, nomeFuncionario,
     *                   email, recebeValeTransporte, cargo (objeto).
     * 
     * @example
     * const json = funcionario.toJSON();
     * // {
     * //   idFuncionario: "67a1b2c3d4e5f6789a0b1c2d",
     * //   nomeFuncionario: "Ana Silva",
     * //   email: "ana@empresa.com",
     * //   recebeValeTransporte: 1,
     * //   cargo: { idCargo: "...", nomeCargo: "..." }
     * // }
     */
    toJSON() {
        return {
            idFuncionario: this._idFuncionario,
            nomeFuncionario: this._nomeFuncionario,
            email: this._email,
            recebeValeTransporte: this._recebeValeTransporte,
            cargo: this._cargo
        };
    }
}