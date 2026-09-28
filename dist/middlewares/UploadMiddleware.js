"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAbonoMiddleware = exports.uploadDispensaMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.resolve(__dirname, "../../uploads/dispensa");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_request, _file, callback) => {
        callback(null, uploadDir);
    },
    filename: (request, file, callback) => {
        const idDispensa = request.params.idDispensa;
        const extensao = path_1.default.extname(file.originalname);
        callback(null, `${idDispensa}${extensao}`);
    }
});
const fileFilter = (_request, file, callback) => {
    const tiposPermitidos = [".jpg", ".jpeg", ".pdf"];
    const extensao = path_1.default.extname(file.originalname).toLowerCase();
    if (tiposPermitidos.includes(extensao)) {
        callback(null, true);
    }
    else {
        callback(new Error("Tipo de arquivo não permitido. Use jpg ou pdf."));
    }
};
exports.uploadDispensaMiddleware = (0, multer_1.default)({ storage, fileFilter });
const uploadDirAbono = path_1.default.resolve(__dirname, "../../uploads/abono");
if (!fs_1.default.existsSync(uploadDirAbono)) {
    fs_1.default.mkdirSync(uploadDirAbono, { recursive: true });
}
const storageAbono = multer_1.default.diskStorage({
    destination: (_request, _file, callback) => {
        callback(null, uploadDirAbono);
    },
    filename: (request, file, callback) => {
        const idAbono = request.params.idAbono;
        const extensao = path_1.default.extname(file.originalname);
        callback(null, `${idAbono}${extensao}`);
    }
});
exports.uploadAbonoMiddleware = (0, multer_1.default)({ storage: storageAbono, fileFilter });
//# sourceMappingURL=UploadMiddleware.js.map