"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARGOS_ACEITOS = exports.CARGO_PROCESSO_PEDAGOGICO = exports.CARGO_INSPETOR = void 0;
exports.normalizarNomeCargo = normalizarNomeCargo;
exports.cargoAceito = cargoAceito;
exports.nomeCargoCanonico = nomeCargoCanonico;
exports.CARGO_INSPETOR = "Inspetor";
exports.CARGO_PROCESSO_PEDAGOGICO = "Processo Pedagógico";
exports.CARGOS_ACEITOS = [
    exports.CARGO_INSPETOR,
    exports.CARGO_PROCESSO_PEDAGOGICO
];
function normalizarNomeCargo(nome) {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}
function cargoAceito(nome) {
    return exports.CARGOS_ACEITOS.some(cargo => normalizarNomeCargo(cargo) === normalizarNomeCargo(nome));
}
function nomeCargoCanonico(nome) {
    return exports.CARGOS_ACEITOS.find(cargo => normalizarNomeCargo(cargo) === normalizarNomeCargo(nome)) || null;
}
//# sourceMappingURL=Cargos.js.map