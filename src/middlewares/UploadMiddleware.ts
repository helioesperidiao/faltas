import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

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
        callback(null, `${idDispensa}${extensao}`);
    }
});

const fileFilter = (_request: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    const tiposPermitidos = [".jpg", ".jpeg", ".pdf"];
    const extensao = path.extname(file.originalname).toLowerCase();
    if (tiposPermitidos.includes(extensao)) {
        callback(null, true);
    } else {
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
        callback(null, `${idAbono}${extensao}`);
    }
});

export const uploadAbonoMiddleware = multer({ storage: storageAbono, fileFilter });