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

        const autorizado = jwt.validarToken(authorization as string);

        if (autorizado === true) {
            const payload = jwt.payload;
            // Garantimos que payload não é null, pois autorizado é true
            if (payload) {
                const obj = {
                    email: payload.email,
                    role: payload.role,
                    name: payload.name,
                    idFuncionario: payload.idFuncionario // necessário para a geração, mas o obj original não o incluía; mantido para consistência
                };

                // Re-gerar token e atualizar no header da requisição
                request.headers.authorization = jwt.gerarToken(obj);
            }

            next(); // Prossegue para o próximo middleware ou controller
        } else {
            const objResposta = {
                status: false,
                msg: "token inválido"
            };

            // Retorna resposta de erro 401 (Unauthorized)
            response.status(401).send(objResposta);
        }
    }
}