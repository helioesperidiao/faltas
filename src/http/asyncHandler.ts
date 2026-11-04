// src/http/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Encapsula um handler async para que rejeições de Promise sejam
 * encaminhadas ao middleware de erro do Express (via next(err)).
 *
 * No Express 4, sem isso, um `throw` dentro de um handler `async`
 * não chega ao middleware de erro e a requisição pode travar.
 *
 * Sem o asyncHandler, os `log.error` do Server.ts NUNCA disparam para
 * erros lançados nos controllers — por isso ele é obrigatório em todas
 * as rotas (ver Lotes 2 a 5).
 *
 * @example
 * router.post("/", jwtMiddleware.validateToken, asyncHandler(controller.create));
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};