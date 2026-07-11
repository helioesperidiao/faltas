import { Request, Response, NextFunction } from 'express';
import { MeuTokenJWT } from '../http/MeuTokenJWT';


/**
 * Middleware para validação de tokens JWT em requisições.
 * 
 * Objetivo:
 * - Garantir que apenas requisições com token válido acessem os endpoints protegidos.
 * - Re-gerar o token e anexá-lo no header da requisição se for válido (refresh token).
 */
export class JwtMiddleware {

    /**
     * Valida o token JWT presente no header 'Authorization' da requisição.
     * 
     * Fluxo:
     * 1. Recupera o header 'authorization' da requisição.
     * 2. Instancia a classe MeuTokenJWT.
     * 3. Valida o token usando MeuTokenJWT.validarToken().
     * 4. Se o token for válido:
     *    - Extrai informações do payload (email, role, name)
     *    - Gera um novo token atualizado e anexa em request.headers.authorization
     *    - Chama next() para prosseguir para o próximo middleware ou controller
     * 5. Se o token for inválido:
     *    - Retorna status HTTP 401 com mensagem de token inválido
     * 
     * @param {Request} request - Objeto de requisição do Express
     * @param {Response} response - Objeto de resposta do Express
     * @param {NextFunction} next - Função next() para passar para o próximo middleware
     */
    validateToken = (request: Request, response: Response, next: NextFunction): void => {
        console.log("🔷 JwtMiddleware.validateToken()");
        const authorization = request.headers.authorization;

        const jwt = new MeuTokenJWT();
        const funcionario = jwt.validarToken(authorization as string);

        if (funcionario) {
            // Opcional: armazena o funcionário na requisição para uso posterior
            (request as any).user = funcionario;

            // Opcional: regenera o token e atualiza o header (se quiser manter refresh)
            // request.headers.authorization = jwt.gerarToken(funcionario);

            next();
        } else {
            response.status(401).send({
                status: false,
                msg: "token inválido"
            });
        }
    };
}