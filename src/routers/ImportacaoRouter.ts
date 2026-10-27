import { Router } from "express";
import multer from "multer";
import path from "path";
import { JwtMiddleware } from "@/middlewares/JwtMiddleware";
import { ImportacaoController } from "@/controllers/ImportacaoController";

/** Rotas de leitura de arquivos que não são planilhas tradicionais. */
export class ImportacaoRouter {
    public static readonly PREFIX = "/api/v1/importacoes";
    private readonly router: Router;

    constructor() {
        this.router = Router();
        const controlador = new ImportacaoController();
        const jwt = new JwtMiddleware();
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_request, arquivo, callback) => {
                const extensao = path.extname(arquivo.originalname).toLowerCase();
                callback(null, extensao === '.pdf' || arquivo.mimetype === 'application/pdf');
            }
        });

        this.router.post(
            ImportacaoRouter.PREFIX + "/pdf",
            jwt.validateToken,
            upload.single('arquivo'),
            controlador.lerPdf
        );
    }

    public getRouter = (): Router => this.router;
}
