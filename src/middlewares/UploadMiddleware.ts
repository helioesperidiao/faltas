import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
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
        const nomeFinal = `${idDispensa}${extensao}`;
        log.info("dispensa: nome do arquivo gerado", {
            idDispensa,
            nomeFinal,
            tamanho: file.size,
            mimetype: file.mimetype,
        });
        callback(null, nomeFinal);
    }
});

const fileFilter = (_request: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
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
        callback(new Error("Tipo de arquivo não permitido. Use jpg ou pdf."));
    }
};

export const uploadDispensaMiddleware = multer({ storage, fileFilter });

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
        const nomeFinal = `${idAbono}${extensao}`;
        log.info("abono: nome do arquivo gerado", {
            idAbono,
            nomeFinal,
            tamanho: file.size,
            mimetype: file.mimetype,
        });
        callback(null, nomeFinal);
    }
});

export const uploadAbonoMiddleware = multer({ storage: storageAbono, fileFilter });

log.debug("configurado", {
    uploadDir,
    uploadDirAbono,
    tiposPermitidos: [".jpg", ".jpeg", ".pdf"],
});