import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { ObjectId } from "mongodb";
import { ErrorResponse } from "../http/ErrorResponse";
// NOVO: logger (padrão de logs)
import { createLogger } from "../logging/Logger";

const log = createLogger("UploadMiddleware");

const uploadDir = path.resolve(__dirname, "../../uploads/dispensa");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_request: Request, _file, callback) => {
        callback(null, uploadDir);
    },
    filename: (request: Request, file, callback) => {
        const idDispensa = request.params.idDispensa;
        const extensao = path.extname(file.originalname);
        const nomeFinal = path.basename(`${idDispensa}${extensao}`);
        log.info("dispensa: nome do arquivo gerado", {
            idDispensa,
            nomeFinal,
            tamanho: file.size,
            mimetype: file.mimetype,
        });
        callback(null, nomeFinal);
    }
});

const fileFilter = (request: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    // O id da rota vira o nome do arquivo: só um ObjectId válido pode chegar ao disco.
    const idRegistro = String(request.params.idAbono ?? request.params.idDispensa ?? "");
    if (!ObjectId.isValid(idRegistro) || !/^[0-9a-f]{24}$/i.test(idRegistro)) {
        log.warn("upload rejeitado", { motivo: "identificador inválido", idRegistro });
        callback(new ErrorResponse(400, "Identificador inválido para anexar o arquivo."));
        return;
    }
    const tiposPermitidos = [".jpg", ".jpeg", ".pdf"];
    const extensao = path.extname(file.originalname).toLowerCase();
    if (tiposPermitidos.includes(extensao)) {
        log.debug("upload aceito", {
            filename: file.originalname,
            extensao,
            mimetype: file.mimetype,
        });
        callback(null, true);
    } else {
        log.warn("upload rejeitado", {
            filename: file.originalname,
            motivo: "tipo não permitido",
            extensao,
            tiposPermitidos,
        });
        callback(new ErrorResponse(400, "Tipo de arquivo não permitido. Use jpg ou pdf."));
    }
};

// Mesmo limite de 10 MB usado nas importações.
const limits = { fileSize: 10 * 1024 * 1024 };

export const uploadDispensaMiddleware = multer({ storage, fileFilter, limits });

const uploadDirAbono = path.resolve(__dirname, "../../uploads/abono");
if (!fs.existsSync(uploadDirAbono)) {
    fs.mkdirSync(uploadDirAbono, { recursive: true });
}

const storageAbono = multer.diskStorage({
    destination: (_request: Request, _file, callback) => {
        callback(null, uploadDirAbono);
    },
    filename: (request: Request, file, callback) => {
        const idAbono = request.params.idAbono;
        const extensao = path.extname(file.originalname);
        const nomeFinal = path.basename(`${idAbono}${extensao}`);
        log.info("abono: nome do arquivo gerado", {
            idAbono,
            nomeFinal,
            tamanho: file.size,
            mimetype: file.mimetype,
        });
        callback(null, nomeFinal);
    }
});

export const uploadAbonoMiddleware = multer({ storage: storageAbono, fileFilter, limits });

log.debug("configurado", {
    uploadDir,
    uploadDirAbono,
    tiposPermitidos: [".jpg", ".jpeg", ".pdf"],
});
// Imagens de movimentações ficam fora da área pública e são acessadas por rota autenticada.
const uploadDirMovimentacao = path.resolve(__dirname, "../../uploads/movimentacao");
fs.mkdirSync(uploadDirMovimentacao, { recursive: true });
export const uploadMovimentacaoMiddleware = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDirMovimentacao),
        filename: (_req, file, cb) => cb(null, require("crypto").randomUUID() + path.extname(file.originalname).toLowerCase())
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if ([".jpg", ".jpeg", ".png"].includes(ext) && ["image/jpeg", "image/png"].includes(file.mimetype)) cb(null, true);
        else cb(new Error("Selecione uma imagem JPG ou PNG."));
    }
});
