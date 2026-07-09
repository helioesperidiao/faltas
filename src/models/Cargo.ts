export class Cargo {
    private _idCargo: string = '';
    private _nomeCargo: string = '';

    constructor() {
        console.log("⬆️  Cargo.constructor()");
    }

    get idCargo(): string {
        return this._idCargo;
    }

    set idCargo(value: string) {
        this._idCargo = value;
    }

    get nomeCargo(): string {
        return this._nomeCargo;
    }

    set nomeCargo(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeCargo deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeCargo deve ter pelo menos 3 caracteres.");
        }
        if (nome.length > 64) {
            throw new Error("nomeCargo deve ter no máximo 64 caracteres.");
        }
        this._nomeCargo = nome;
    }

    /**
     * Controla a serialização para JSON.
     * Remove os underlines dos campos.
     */
    toJSON() {
        return {
            idCargo: this._idCargo,
            nomeCargo: this._nomeCargo
        };
    }
}