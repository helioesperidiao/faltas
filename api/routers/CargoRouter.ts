import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { CargoMiddleware } from "../middlewares/CargoMiddleware";
import { CargoController } from "../controllers/CargoController";

/**
 * Classe responsável por configurar as rotas da entidade Cargo.
 * 
 * Observações sobre injeção de dependência:
 * - O roteador não cria suas próprias instâncias de middlewares ou controladores.
 * - Ele recebe instâncias externas de JwtMiddleware, CargoMiddleware e CargoControle via construtor.
 * - Isso permite flexibilidade: 
 *      - Testes unitários podem injetar mocks ou stubs;
 *      - É possível trocar implementações sem alterar o roteador;
 *      - Segue o princípio de inversão de dependência (SOLID).
 */
export class CargoRouter {
    private _router: Router;
    private _jwtMiddleware: JwtMiddleware;
    private _cargoMiddleware: CargoMiddleware;
    private _cargoControl: CargoController;

    /**
     * Construtor da classe CargoRoteador
     * 
     * Injeção de dependência:
     * @param {Router} routerDependency - Instância do Router do Express
     * @param {JwtMiddleware} jwtMiddlewareDependency - Middleware JWT externo injetado
     * @param {CargoMiddleware} cargoMiddlewareDependency - Middleware de validação de Cargo injetado
     * @param {CargoControl} cargoControllerDependency - Controlador de Cargo injetado
     */
    constructor(
        routerDependency: Router,
        jwtMiddlewareDependency: JwtMiddleware,
        cargoMiddlewareDependency: CargoMiddleware,
        cargoControllerDependency: CargoController
    ) {
        console.log("⬆️  CargoRoteador.constructor()");
        this._router = routerDependency;
        this._jwtMiddleware = jwtMiddlewareDependency;
        this._cargoMiddleware = cargoMiddlewareDependency;
        this._cargoControl = cargoControllerDependency;
    }

    /**
     * Configura as rotas da API REST para a entidade Cargo.
     * 
     * Rotas configuradas:
     * POST "/"           -> Criar um novo Cargo (validação JWT + body)
     * GET "/"            -> Listar todos os Cargos (validação JWT)
     * GET "/:idCargo"    -> Buscar Cargo por ID (validação JWT + id param)
     * PUT "/:idCargo"    -> Atualizar Cargo por ID (validação JWT + id param + body)
     * DELETE "/:idCargo" -> Deletar Cargo por ID (validação JWT + id param)
     * 
     * Todas as dependências (JWT, middleware de validação, controlador) são fornecidas externamente,
     * permitindo maior flexibilidade e testabilidade do código.
     * 
     * @returns {Router} Router configurado com todas as rotas de Cargo
     */
    createRoutes = (): Router => {
        console.log("⬆️  CargoRoteador.createRoutes()");

        this._router.post(
            "/",
            this._jwtMiddleware.validateToken,
            this._cargoMiddleware.validateBody,
            this._cargoControl.store
        );

        this._router.get(
            "/",
            this._jwtMiddleware.validateToken,
            this._cargoControl.index
        );

        this._router.get(
            "/:idCargo",
            this._jwtMiddleware.validateToken,
            this._cargoMiddleware.validateIdParam,
            this._cargoControl.show
        );

        this._router.put(
            "/:idCargo",
            this._jwtMiddleware.validateToken,
            this._cargoMiddleware.validateIdParam,
            this._cargoMiddleware.validateBody,
            this._cargoControl.update
        );

        this._router.delete(
            "/:idCargo",
            this._jwtMiddleware.validateToken,
            this._cargoMiddleware.validateIdParam,
            this._cargoControl.destroy
        );

        return this._router;
    };
}