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
/** Cargo atual de um funcionário ativo, ou `null` se ele não existe mais ou foi excluído. */
export type SituacaoFuncionario = { idCargo: string; nomeCargo: string } | null;
export type ConsultaFuncionarioAtivo = (idFuncionario: string) => Promise<SituacaoFuncionario>;

export class JwtMiddleware {
    /** Registrada pelo Server no boot; sem ela (testes de unidade), vale só o token. */
    private static consultaFuncionario: ConsultaFuncionarioAtivo | null = null;
    /** Cache curto por funcionário: evita uma ida ao banco por requisição. */
    private static readonly cache = new Map<string, { situacao: SituacaoFuncionario; expiraEm: number }>();
    private static readonly VALIDADE_CACHE_MS = 60 * 1000;

    public static configurarConsultaFuncionario(consulta: ConsultaFuncionarioAtivo): void {
        JwtMiddleware.consultaFuncionario = consulta;
        JwtMiddleware.cache.clear();
    }

    /** Chamado ao alterar ou excluir um funcionário, para a mudança valer na próxima requisição. */
    public static esquecerFuncionario(idFuncionario: string): void {
        JwtMiddleware.cache.delete(idFuncionario);
    }

    private static async situacaoAtual(idFuncionario: string): Promise<SituacaoFuncionario> {
        const agora = Date.now();
        const guardada = JwtMiddleware.cache.get(idFuncionario);
        if (guardada && guardada.expiraEm > agora) return guardada.situacao;
        const situacao = await JwtMiddleware.consultaFuncionario!(idFuncionario);
        JwtMiddleware.cache.set(idFuncionario, { situacao, expiraEm: agora + JwtMiddleware.VALIDADE_CACHE_MS });
        return situacao;
    }

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
    public validateToken = async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
        log.debug("validateToken()");
        const authorization = request.headers.authorization;

        const jwt = new MeuTokenJWT();
        const funcionario: Funcionario | null = jwt.validarToken(authorization as string);

        // O token só prova quem o recebeu no login. O banco diz se essa pessoa ainda está
        // ativa e qual é o cargo dela agora: excluído perde o acesso, e um cargo trocado
        // vale já, sem esperar o token expirar.
        if (funcionario && JwtMiddleware.consultaFuncionario) {
            const situacao = await JwtMiddleware.situacaoAtual(funcionario.idFuncionario);
            if (!situacao) {
                log.warn("token de funcionário inativo", { idFuncionario: funcionario.idFuncionario });
                throw new ErrorResponse(401, "Sessão encerrada. Entre novamente.");
            }
            funcionario.cargo.idCargo = situacao.idCargo;
            funcionario.cargo.nomeCargo = situacao.nomeCargo;
        }

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