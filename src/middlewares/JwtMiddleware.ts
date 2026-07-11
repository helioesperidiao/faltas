import { Request, Response, NextFunction } from 'express';
import { MeuTokenJWT } from '../http/MeuTokenJWT';
import { ErrorResponse } from '../http/ErrorResponse';

export class JwtMiddleware {
    validateToken = (request: Request, _response: Response, next: NextFunction): void => {
        console.log("🔷 JwtMiddleware.validateToken()");
        const authorization = request.headers.authorization;

        const jwt = new MeuTokenJWT();
        const funcionario = jwt.validarToken(authorization as string);

        if (funcionario) {
            (request as any).user = funcionario;
            next();
        } else {
            throw new ErrorResponse(401, "Token inválido");
        }
    };
}