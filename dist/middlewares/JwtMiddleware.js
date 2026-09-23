"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtMiddleware = void 0;
const MeuTokenJWT_1 = require("../http/MeuTokenJWT");
const ErrorResponse_1 = require("../http/ErrorResponse");
class JwtMiddleware {
    validateToken = (request, _response, next) => {
        console.log("🔷 JwtMiddleware.validateToken()");
        const authorization = request.headers.authorization;
        const jwt = new MeuTokenJWT_1.MeuTokenJWT();
        const funcionario = jwt.validarToken(authorization);
        if (funcionario) {
            request.funcionarioLogado = funcionario;
            next();
        }
        else {
            throw new ErrorResponse_1.ErrorResponse(401, "Token inválido");
        }
    };
}
exports.JwtMiddleware = JwtMiddleware;
//# sourceMappingURL=JwtMiddleware.js.map