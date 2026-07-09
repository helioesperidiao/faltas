/**
 * Classe personalizada de erro para a aplicação.
 * 
 * Estende a classe nativa Error do JavaScript para incluir:
 * - Código HTTP (httpCode)
 * - Informações adicionais sobre o erro (error)
 * 
 * Pode ser utilizada em middlewares ou serviços para padronizar respostas de erro.
 */
export class ErrorResponse extends Error {
    private _httpCode: number;
    private _error: any;
    private _name: string;

    /**
     * Construtor da classe ErrorResponse
     * @param {number} httpCode - Código de status HTTP (ex: 400, 404, 500)
     * @param {string} message - Mensagem de erro descritiva
     * @param {any} error - Objeto adicional com detalhes do erro (opcional)
     */
    constructor(httpCode: number, message: string, error: any = null) {
        super(message); // Chama o construtor da classe Error
        this._name = "ErrorResponse";
        this._httpCode = httpCode; // Código HTTP
        this._error = error;       // Informações adicionais

        // Mantém o stack trace adequado para instâncias de ErrorResponse
        Object.setPrototypeOf(this, ErrorResponse.prototype);
    }

    /**
     * Retorna o código HTTP associado ao erro.
     * @returns {number} Código HTTP
     */
    get httpCode(): number {
        return this._httpCode;
    }

    /**
     * Retorna informações adicionais sobre o erro.
     * @returns {any} Objeto JSON ou string com detalhes do erro
     */
    get error(): any {
        return this._error;
    }

    /**
     * Retorna o nome do erro.
     * @returns {string} Nome do erro
     */
    get name(): string {
        return this._name;
    }
}