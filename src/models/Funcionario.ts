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

    get idFuncionario(): string {
        return this._idFuncionario;
    }

    set idFuncionario(value: string) {

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
        if (typeof value !== "string") {
            throw new Error("senha deve ser uma string.");
        }
        const senhaTrimmed = value.trim();
        if (senhaTrimmed === "") {
            throw new Error("senha não pode ser vazia.");
        }
        if (senhaTrimmed.length < 6) {
            throw new Error("senha deve ter pelo menos 6 caracteres.");
        }
        if (!/[A-Z]/.test(senhaTrimmed)) {
            throw new Error("senha deve conter pelo menos uma letra maiúscula.");
        }
        if (!/[0-9]/.test(senhaTrimmed)) {
            throw new Error("senha deve conter pelo menos um número.");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(senhaTrimmed)) {
            throw new Error("senha deve conter pelo menos um caractere especial.");
        }
        this._senha = senhaTrimmed;
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