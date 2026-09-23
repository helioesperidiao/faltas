"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponse = void 0;
class ErrorResponse extends Error {
    _httpCode;
    _error;
    _name;
    constructor(httpCode, message, error = null) {
        super(message);
        this._name = "ErrorResponse";
        this._httpCode = httpCode;
        this._error = error;
        Object.setPrototypeOf(this, ErrorResponse.prototype);
    }
    get httpCode() {
        return this._httpCode;
    }
    get error() {
        return this._error;
    }
    get name() {
        return this._name;
    }
}
exports.ErrorResponse = ErrorResponse;
//# sourceMappingURL=ErrorResponse.js.map