"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auditoria = void 0;
class Auditoria {
    _criadoPor = '';
    _criadoEm = new Date();
    _alteradoPor = '';
    _alteradoEm = null;
    _deletadoPor = '';
    _deletadoEm = null;
    get criadoPor() {
        return this._criadoPor;
    }
    set criadoPor(value) {
        this._criadoPor = value;
    }
    get criadoEm() {
        return this._criadoEm;
    }
    set criadoEm(value) {
        this._criadoEm = value;
    }
    get alteradoPor() {
        return this._alteradoPor;
    }
    set alteradoPor(value) {
        this._alteradoPor = value;
    }
    get alteradoEm() {
        return this._alteradoEm;
    }
    set alteradoEm(value) {
        this._alteradoEm = value;
    }
    get deletadoPor() {
        return this._deletadoPor;
    }
    set deletadoPor(value) {
        this._deletadoPor = value;
    }
    get deletadoEm() {
        return this._deletadoEm;
    }
    set deletadoEm(value) {
        this._deletadoEm = value;
    }
    marcarCriadoPor(idFuncionario) {
        this._criadoPor = idFuncionario;
        this._criadoEm = new Date();
    }
    marcarAlteradoPor(idFuncionario) {
        this._alteradoPor = idFuncionario;
        this._alteradoEm = new Date();
    }
    marcarDeletadoPor(idFuncionario) {
        this._deletadoPor = idFuncionario;
        this._deletadoEm = new Date();
    }
    isDeletado() {
        return this._deletadoEm !== null && this._deletadoPor !== '';
    }
    toJSON() {
        return {
            criadoPor: this._criadoPor,
            criadoEm: this._criadoEm.toISOString(),
            alteradoPor: this._alteradoPor,
            alteradoEm: this._alteradoEm ? this._alteradoEm.toISOString() : null,
            deletadoPor: this._deletadoPor,
            deletadoEm: this._deletadoEm ? this._deletadoEm.toISOString() : null
        };
    }
}
exports.Auditoria = Auditoria;
//# sourceMappingURL=Auditoria.js.map