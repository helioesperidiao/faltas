/**
 * Classe padrão para respostas da API.
 * 
 * Unifica o formato de respostas de sucesso e erro,
 * seguindo o mesmo padrão do ErrorResponse.
 * 
 * Exemplo de uso:
 * 
 * // Sucesso
 * return StandardResponse.success(res, "Busca realizada", data);
 * 
 * // Erro
 * return StandardResponse.error(res, 400, "Dados inválidos", { field: "email" });
 */
export class StandardResponse {
    private _success: boolean;
    private _message: string;
    private _data: any;
    private _error: any;
    private _httpCode: number;

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

    get success(): boolean { return this._success; }
    get httpCode(): number { return this._httpCode; }
    get message(): string { return this._message; }
    get data(): any { return this._data; }
    get error(): any { return this._error; }

    toJSON() {
        const response: any = { success: this._success, message: this._message };
        if (this._data !== null) response.data = this._data;
        if (this._error !== null) response.error = this._error;
        return response;
    }

    send(res: any) {
        return res.status(this._httpCode).json(this.toJSON());
    }

    // Métodos estáticos
    static success(message: string, data: any = null, httpCode: number = 200): StandardResponse {
        return new StandardResponse(true, httpCode, message, data, null);
    }

    static error(message: string, error: any = null, httpCode: number = 400): StandardResponse {
        return new StandardResponse(false, httpCode, message, null, error);
    }

    static created(message: string, data: any = null): StandardResponse {
        return StandardResponse.success(message, data, 201);
    }

    static noContent(): StandardResponse {
        return new StandardResponse(true, 204, "", null, null);
    }

    static notFound(message: string = "Recurso não encontrado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 404);
    }

    static unauthorized(message: string = "Não autorizado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 401);
    }

    static forbidden(message: string = "Acesso negado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 403);
    }

    static internalError(message: string = "Erro interno do servidor", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 500);
    }
}