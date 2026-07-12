/**
 * Classe padrão para respostas da API.
 * 
 * Unifica o formato de respostas de sucesso e erro, seguindo o mesmo padrão
 * do ErrorResponse. Fornece métodos estáticos para os principais códigos HTTP
 * e permite encadeamento com o método `send()`.
 * 
 * @example
 * // Sucesso com dados
 * StandardResponse.success("Busca realizada", { usuarios: [] }).send(res);
 * 
 * // Erro com detalhes
 * StandardResponse.error("Dados inválidos", { campo: "email" }, 400).send(res);
 * 
 * // Resposta 201 (criado)
 * StandardResponse.created("Cadastro realizado", { id: 1 }).send(res);
 * 
 * // Resposta 204 (sem conteúdo)
 * StandardResponse.noContent().send(res);
 * 
 * // Resposta 404 (não encontrado)
 * StandardResponse.notFound("Cargo não encontrado").send(res);
 */
export class StandardResponse {
    private _success: boolean;
    private _message: string;
    private _data: any;
    private _error: any;
    private _httpCode: number;

    /**
     * Construtor privado da classe StandardResponse.
     * 
     * Use os métodos estáticos (success, error, created, etc.) para criar instâncias.
     * 
     * @param {boolean} success - Indica se a operação foi bem-sucedida.
     * @param {number} httpCode - Código HTTP da resposta (ex: 200, 400, 404).
     * @param {string} message - Mensagem descritiva da resposta.
     * @param {any} [data=null] - Dados adicionais para respostas de sucesso.
     * @param {any} [error=null] - Detalhes do erro para respostas de falha.
     */
    private constructor(
        success: boolean,
        httpCode: number,
        message: string,
        data: any = null,
        error: any = null
    ) {
        this._success = success;
        this._httpCode = httpCode;
        this._message = message;
        this._data = data;
        this._error = error;
    }

    // ======================== GETTERS ========================

    /** Indica se a operação foi bem-sucedida. */
    get success(): boolean { return this._success; }

    /** Código HTTP da resposta (ex: 200, 400, 404). */
    get httpCode(): number { return this._httpCode; }

    /** Mensagem descritiva da resposta. */
    get message(): string { return this._message; }

    /** Dados adicionais para respostas de sucesso (pode ser null). */
    get data(): any { return this._data; }

    /** Detalhes do erro para respostas de falha (pode ser null). */
    get error(): any { return this._error; }

    /**
     * Converte a resposta para um objeto JSON.
     * 
     * Inclui os campos `success` e `message` sempre, e opcionalmente `data` ou `error`
     * se não forem null.
     * 
     * @returns {Object} Objeto formatado para ser serializado em JSON.
     */
    public toJSON() {
        const response: any = { success: this._success, message: this._message };
        if (this._data !== null) response.data = this._data;
        if (this._error !== null) response.error = this._error;
        return response;
    }

    /**
     * Envia a resposta HTTP com o código de status e JSON correspondentes.
     * 
     * @param {Response} res - Objeto de resposta do Express.
     * @returns {Response} O objeto de resposta do Express (para encadeamento).
     * 
     * @example
     * StandardResponse.success("Operação realizada").send(res);
     */
    public send(res: any) {
        return res.status(this._httpCode).json(this.toJSON());
    }

    // ======================== MÉTODOS ESTÁTICOS ========================

    /**
     * Cria uma resposta de sucesso (padrão: 200 OK).
     * 
     * @param {string} message - Mensagem descritiva.
     * @param {any} [data=null] - Dados adicionais para incluir na resposta.
     * @param {number} [httpCode=200] - Código HTTP (ex: 200, 201, 204).
     * @returns {StandardResponse} Instância da resposta.
     */
    static success(message: string, data: any = null, httpCode: number = 200): StandardResponse {
        return new StandardResponse(true, httpCode, message, data, null);
    }

    /**
     * Cria uma resposta de erro (padrão: 400 Bad Request).
     * 
     * @param {string} message - Mensagem descritiva do erro.
     * @param {any} [error=null] - Detalhes adicionais do erro.
     * @param {number} [httpCode=400] - Código HTTP (ex: 400, 404, 500).
     * @returns {StandardResponse} Instância da resposta.
     */
    static error(message: string, error: any = null, httpCode: number = 400): StandardResponse {
        return new StandardResponse(false, httpCode, message, null, error);
    }

    /**
     * Cria uma resposta de sucesso com status 201 (Created).
     * 
     * @param {string} message - Mensagem descritiva.
     * @param {any} [data=null] - Dados adicionais (ex: recurso criado).
     * @returns {StandardResponse} Instância da resposta.
     */
    static created(message: string, data: any = null): StandardResponse {
        return StandardResponse.success(message, data, 201);
    }

    /**
     * Cria uma resposta de sucesso sem conteúdo (status 204 No Content).
     * 
     * @returns {StandardResponse} Instância da resposta.
     */
    static noContent(): StandardResponse {
        return new StandardResponse(true, 204, "", null, null);
    }

    /**
     * Cria uma resposta de erro com status 404 (Not Found).
     * 
     * @param {string} [message="Recurso não encontrado"] - Mensagem descritiva.
     * @param {any} [error=null] - Detalhes adicionais do erro.
     * @returns {StandardResponse} Instância da resposta.
     */
    static notFound(message: string = "Recurso não encontrado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 404);
    }

    /**
     * Cria uma resposta de erro com status 401 (Unauthorized).
     * 
     * @param {string} [message="Não autorizado"] - Mensagem descritiva.
     * @param {any} [error=null] - Detalhes adicionais do erro.
     * @returns {StandardResponse} Instância da resposta.
     */
    static unauthorized(message: string = "Não autorizado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 401);
    }

    /**
     * Cria uma resposta de erro com status 403 (Forbidden).
     * 
     * @param {string} [message="Acesso negado"] - Mensagem descritiva.
     * @param {any} [error=null] - Detalhes adicionais do erro.
     * @returns {StandardResponse} Instância da resposta.
     */
    static forbidden(message: string = "Acesso negado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 403);
    }

    /**
     * Cria uma resposta de erro com status 500 (Internal Server Error).
     * 
     * @param {string} [message="Erro interno do servidor"] - Mensagem descritiva.
     * @param {any} [error=null] - Detalhes adicionais do erro.
     * @returns {StandardResponse} Instância da resposta.
     */
    static internalError(message: string = "Erro interno do servidor", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 500);
    }
}