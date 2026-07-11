import { ObjectId } from "mongodb";
import { Cargo } from "./Cargo";

/**
 * Representa a entidade Funcionario do sistema.
 * 
 * Objetivo:
 * - Encapsular os dados de um funcionário.
 * - Garantir integridade dos atributos via getters e setters.
 * - Associar corretamente um funcionário a um Cargo.
 */
export class Funcionario {
    private _idFuncionario: string = '';
    private _cargo!: Cargo; // Usando ! para indicar que será definido via setter
    private _nomeFuncionario: string = '';
    private _email: string = '';
    private _senha: string = '';
    private _recebeValeTransporte: number = 0; // 0 ou 1

    constructor(){
        this._cargo = new Cargo();
    }
    get idFuncionario(): string {
        return this._idFuncionario;
    }

   set idFuncionario(value: string) {
        if (!value) {
            throw new Error("idCargo é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idCargo inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idFuncionario = value;
    }


    get cargo(): Cargo {
        return this._cargo;
    }

    set cargo(value: Cargo) {
        if (!(value instanceof Cargo)) {
            throw new Error("cargo deve ser uma instância válida de Cargo.");
        }
        this._cargo = value;
    }

    get nomeFuncionario(): string {
        return this._nomeFuncionario;
    }

    set nomeFuncionario(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeFuncionario deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeFuncionario deve ter pelo menos 3 caracteres.");
        }
        this._nomeFuncionario = nome;
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        if (typeof value !== "string") {
            throw new Error("email deve ser uma string.");
        }
        const emailTrimmed = value.trim();
        if (emailTrimmed === "") {
            throw new Error("email não pode ser vazio.");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            throw new Error("email em formato inválido.");
        }
        this._email = emailTrimmed;
    }

    get senha(): string {
        return this._senha;
    }

    set senha(value: string) {
 
        this._senha = value;
    }

    get recebeValeTransporte(): number {
        return this._recebeValeTransporte;
    }

    set recebeValeTransporte(value: number) {
        if (![0, 1].includes(value)) {
            throw new Error("recebeValeTransporte deve ser 0 ou 1.");
        }
        this._recebeValeTransporte = value;
    }
    toJSON() {
        return {
            idFuncionario: this._idFuncionario,
            nomeFuncionario: this._nomeFuncionario,
            email: this._email,
            recebeValeTransporte: this._recebeValeTransporte,
            cargo: this._cargo
        };
    }
    
}