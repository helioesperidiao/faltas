import { Request, Response, NextFunction } from 'express';
import { MeuTokenJWT } from '../http/MeuTokenJWT';
import { ErrorResponse } from '../http/ErrorResponse';
import { Funcionario } from '@/models/Funcionario';
import { cargoAceito } from '@/constants/Cargos';
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("JwtMiddleware");

/**
 * Middleware para validação de tokens JWT em requisições.
 * 
 * Este middleware intercepta requisições, extrai o token do header `Authorization`,
 * valida-o e, se válido, injeta o objeto `Funcionario` decodificado na requisição
 * para uso em controllers e serviços subsequentes.
 * 
 * @example
 * // Uso em uma rota
 * router.get("/protegido", jwtMiddleware.validateToken, (req, res) => {
 *   const funcionario = req.funcionarioLogado;
 *   // ... lógica protegida
 * });
 * 
 * @example
 * // Lançando erro caso o token seja inválido
 * // O erro será capturado pelo middleware global de erros
 */
export class JwtMiddleware {
    /**
     * Valida o token JWT presente no header `Authorization` da requisição.
     * 
     * Fluxo:
     * 1. Obtém o header `authorization` da requisição.
     * 2. Instancia a classe `MeuTokenJWT`.
     * 3. Valida e decodifica o token usando `MeuTokenJWT.validarToken()`.
     * 4. Se o token for válido e o cargo for aceito:
     *    - Injeta o objeto `Funcionario` na propriedade `funcionarioLogado` da requisição.
     *    - Chama `next()` para prosseguir ao próximo middleware/controller.
     * 5. Se o token for inválido, ausente ou de cargo não aceito:
     *    - Lança um `ErrorResponse` com status 401 (Unauthorized).
     * 
     * @param {Request} request - Objeto de requisição do Express.
     * @param {Response} _response - Objeto de resposta do Express (não utilizado).
     * @param {NextFunction} next - Função para passar o controle ao próximo middleware.
     * @throws {ErrorResponse} Lança erro 401 se o token for inválido ou ausente.
     * 
     * @example
     * // Middleware aplicado a uma rota
     * app.get("/perfil", jwtMiddleware.validateToken, perfilController);
     */
    public validateToken = (request: Request, _response: Response, next: NextFunction): void => {
        log.debug("validateToken()");
        const authorization = request.headers.authorization;

        const jwt = new MeuTokenJWT();
        const funcionario: Funcionario | null = jwt.validarToken(authorization as string);

        if (funcionario && cargoAceito(funcionario.cargo.nomeCargo)) {
            // Injeta o funcionário decodificado na requisição para uso posterior
            (request as any).funcionarioLogado = funcionario;
            log.debug("token válido", {
                idFuncionario: funcionario.idFuncionario,
                nomeCargo: funcionario.cargo.nomeCargo,
            });
            next();
        } else {
            // Loga o motivo exato antes de lançar para diagnóstico
            if (!funcionario) {
                log.warn("token inválido ou ausente");
            } else {
                log.warn("cargo não autorizado", {
                    nomeCargo: funcionario.cargo?.nomeCargo,
                });
            }
            throw new ErrorResponse(401, "Token inválido");
        }
    };
}