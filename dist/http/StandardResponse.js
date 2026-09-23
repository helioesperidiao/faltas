"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardResponse = void 0;
class StandardResponse {
    _success;
    _message;
    _data;
    _error;
    _httpCode;
    constructor(success, httpCode, message, data = null, error = null) {
        this._success = success;
        this._httpCode = httpCode;
        this._message = message;
        this._data = data;
        this._error = error;
    }
    get success() { return this._success; }
    get httpCode() { return this._httpCode; }
    get message() { return this._message; }
    get data() { return this._data; }
    get error() { return this._error; }
    toJSON() {
        const response = { success: this._success, message: this._message };
        if (this._data !== null)
            response.data = this._data;
        if (this._error !== null)
            response.error = this._error;
        return response;
    }
    send(res) {
        return res.status(this._httpCode).json(this.toJSON());
    }
    static success(message, data = null, httpCode = 200) {
        return new StandardResponse(true, httpCode, message, data, null);
    }
    static error(message, error = null, httpCode = 400) {
        return new StandardResponse(false, httpCode, message, null, error);
    }
    static created(message, data = null) {
        return StandardResponse.success(message, data, 201);
    }
    static noContent() {
        return new StandardResponse(true, 204, "", null, null);
    }
    static notFound(message = "Recurso não encontrado", error = null) {
        return StandardResponse.error(message, error, 404);
    }
    static unauthorized(message = "Não autorizado", error = null) {
        return StandardResponse.error(message, error, 401);
    }
    static forbidden(message = "Acesso negado", error = null) {
        return StandardResponse.error(message, error, 403);
    }
    static internalError(message = "Erro interno do servidor", error = null) {
        return StandardResponse.error(message, error, 500);
    }
}
exports.StandardResponse = StandardResponse;
//# sourceMappingURL=StandardResponse.js.map