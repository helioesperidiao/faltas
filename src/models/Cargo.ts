import { ObjectId } from "mongodb";
import { Auditoria } from "./Auditoria";

/**
 * Representa a entidade Cargo do sistema.
 * 
 * Encapsula os dados de um cargo, garantindo a integridade dos atributos
 * por meio de validações nos setters:
 * - `idCargo`: deve ser um ObjectId válido do MongoDB (24 caracteres hexadecimais).
 * - `nomeCargo`: deve ser uma string não vazia com pelo menos 3 caracteres e no máximo 64.
 * 
 * @example
 * // Criar uma instância e definir valores válidos
 * const cargo = new Cargo();
 * cargo.idCargo = "507f1f77bcf86cd799439011";
 * cargo.nomeCargo = "Administrador";
 * 
 * @example
 * // Serialização para JSON (usando o método toJSON)
 * console.log(JSON.stringify(cargo));
 * // Saída: {"idCargo":"507f1f77bcf86cd799439011","nomeCargo":"Administrador"}
 */
export class Cargo {
    private _idCargo: string = '';
    private _nomeCargo: string = '';
    private _auditoria: Auditoria = new Auditoria();

    /**
     * Construtor da classe Cargo.
     * 
     * Inicializa uma nova instância de Cargo com valores padrão vazios.
     * Os valores devem ser definidos posteriormente através dos setters.
     * 
     * @example
     * const cargo = new Cargo();
     */
    constructor() {
        console.log("⬆️  Cargo.constructor()");
    }

    /**
     * Obtém o identificador único do cargo.
     * 
     * @returns {string} ID do cargo (string hex do ObjectId).
     */
    get idCargo(): string {
        return this._idCargo;
    }

    /**
     * Define o identificador único do cargo.
     * 
     * 🔹 Regra de domínio: deve ser um ObjectId válido do MongoDB.
     * 
     * @param {string} value - ID do cargo no formato hexadecimal de 24 caracteres.
     * @throws {Error} Lança erro se o valor for vazio, nulo ou não for um ObjectId válido.
     * 
     * @example
     * cargo.idCargo = "507f1f77bcf86cd799439011"; // ✅ válido
     * cargo.idCargo = "123";                       // ❌ lança erro
     * cargo.idCargo = "";                          // ❌ lança erro
     */
    set idCargo(value: string) {
        if (!value) {
            throw new Error("idCargo é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idCargo inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idCargo = value;
    }

    /**
     * Obtém o nome do cargo.
     * 
     * @returns {string} Nome do cargo.
     */
    get nomeCargo(): string {
        return this._nomeCargo;
    }

    /**
     * Define o nome do cargo.
     * 
     * 🔹 Regra de domínio:
     * - Deve ser uma string não vazia.
     * - Deve ter pelo menos 3 caracteres.
     * - Deve ter no máximo 64 caracteres.
     * - Espaços em branco no início/fim são removidos automaticamente.
     * 
     * @param {string} value - Nome do cargo.
     * @throws {Error} Lança erro se não for string, estiver vazio ou não atender ao tamanho mínimo/máximo.
     * 
     * @example
     * cargo.nomeCargo = "Gerente";      // ✅ válido
     * cargo.nomeCargo = "  Analista  "; // ✅ válido (trim será aplicado)
     * cargo.nomeCargo = "AB";           // ❌ lança erro (menos de 3 caracteres)
     * cargo.nomeCargo = null;           // ❌ lança erro
     */
    set nomeCargo(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeCargo deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeCargo deve ter pelo menos 3 caracteres.");
        }
        if (nome.length > 64) {
            throw new Error("nomeCargo deve ter no máximo 64 caracteres.");
        }
        this._nomeCargo = nome;
    }

    // ======================== MÉTODOS DE AUDITORIA ========================

    /**
     * Obtém o objeto de auditoria associado ao cargo.
     * 
     * @returns {Auditoria} Instância de Auditoria contendo os registros de criação, alteração e exclusão.
     */
    get auditoria(): Auditoria {
        return this._auditoria;
    }

    /**
     * Define o objeto de auditoria completo.
     * 
     * @param {Auditoria} value - Instância de Auditoria a ser atribuída.
     */
    set auditoria(value: Auditoria) {
        this._auditoria = value;
    }

    /**
     * Define o ID do funcionário que criou o cargo.
     * 
     * @param {string} idFuncionario - ID do funcionário que realizou a criação.
     */
    public marcarCriadoPor(idFuncionario: string): void {
        this._auditoria.marcarCriadoPor(idFuncionario);
    }

    /**
     * Define o ID do funcionário que alterou o cargo pela última vez.
     * 
     * @param {string} idFuncionario - ID do funcionário que realizou a alteração.
     */
    public marcarAlteradoPor(idFuncionario: string): void {
        this._auditoria.marcarAlteradoPor(idFuncionario);
    }

    /**
     * Define o ID do funcionário que realizou a exclusão lógica (soft delete).
     * 
     * @param {string} idFuncionario - ID do funcionário que realizou a exclusão.
     */
    public marcarDeletadoPor(idFuncionario: string): void {
        this._auditoria.marcarDeletadoPor(idFuncionario);
    }

    /**
     * Verifica se o cargo foi deletado (soft delete).
     * 
     * @returns {boolean} true se foi deletado, false caso contrário.
     */
    public isDeletado(): boolean {
        return this._auditoria.isDeletado();
    }

    // ======================== SERIALIZAÇÃO ========================

    /**
     * Controla a serialização da instância para JSON.
     * 
     * Remove os underlines dos campos privados, retornando um objeto
     * com as chaves `idCargo`, `nomeCargo` e `auditoria`.
     * 
     * Este método é chamado automaticamente pelo `JSON.stringify()`.
     * 
     * @returns {Object} Objeto com os campos públicos para serialização.
     * 
     * @example
     * const cargo = new Cargo();
     * cargo.idCargo = "507f1f77bcf86cd799439011";
     * cargo.nomeCargo = "Administrador";
     * console.log(JSON.stringify(cargo));
     * // Saída: {"idCargo":"507f1f77bcf86cd799439011","nomeCargo":"Administrador"}
     */
    toJSON() {
        return {
            idCargo: this._idCargo,
            nomeCargo: this._nomeCargo,
            auditoria: this._auditoria
        };
    }
}