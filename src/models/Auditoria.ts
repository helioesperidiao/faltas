// src/models/Auditoria.ts

/**
 * Classe que representa os dados de auditoria de uma entidade.
 * 
 * Armazena informações sobre quem criou, quem alterou e quem realizou
 * soft delete de um registro, além dos respectivos timestamps.
 * 
 * @example
 * const auditoria = new Auditoria();
 * auditoria.criadoPor = "67a1b2c3d4e5f6789a0b1c2d";
 * auditoria.criadoEm = new Date();
 * auditoria.alteradoPor = "67a1b2c3d4e5f6789a0b1c2d";
 * auditoria.alteradoEm = new Date();
 */
export class Auditoria {
    private _criadoPor: string = '';          // ID do funcionário que criou
    private _criadoEm: Date = new Date();      // Data de criação
    private _alteradoPor: string = '';         // ID do funcionário que alterou
    private _alteradoEm: Date | null = null;   // Data da última alteração
    private _deletadoPor: string = '';         // ID do funcionário que deletou (soft delete)
    private _deletadoEm: Date | null = null;   // Data do soft delete

    // ======================== GETTERS E SETTERS ========================

    get criadoPor(): string {
        return this._criadoPor;
    }

    set criadoPor(value: string) {
        this._criadoPor = value;
    }

    get criadoEm(): Date {
        return this._criadoEm;
    }

    set criadoEm(value: Date) {
        this._criadoEm = value;
    }

    get alteradoPor(): string {
        return this._alteradoPor;
    }

    set alteradoPor(value: string) {
        this._alteradoPor = value;
    }

    get alteradoEm(): Date | null {
        return this._alteradoEm;
    }

    set alteradoEm(value: Date | null) {
        this._alteradoEm = value;
    }

    get deletadoPor(): string {
        return this._deletadoPor;
    }

    set deletadoPor(value: string) {
        this._deletadoPor = value;
    }

    get deletadoEm(): Date | null {
        return this._deletadoEm;
    }

    set deletadoEm(value: Date | null) {
        this._deletadoEm = value;
    }

    // ======================== MÉTODOS UTILITÁRIOS ========================

    /**
     * Marca o registro como criado por um funcionário.
     * @param idFuncionario - ID do funcionário que está criando.
     */
    public marcarCriadoPor(idFuncionario: string): void {
        this._criadoPor = idFuncionario;
        this._criadoEm = new Date();
    }

    /**
     * Marca o registro como alterado por um funcionário.
     * @param idFuncionario - ID do funcionário que está alterando.
     */
    public marcarAlteradoPor(idFuncionario: string): void {
        this._alteradoPor = idFuncionario;
        this._alteradoEm = new Date();
    }

    /**
     * Marca o registro como deletado (soft delete) por um funcionário.
     * @param idFuncionario - ID do funcionário que está deletando.
     */
    public marcarDeletadoPor(idFuncionario: string): void {
        this._deletadoPor = idFuncionario;
        this._deletadoEm = new Date();
    }

    /**
     * Verifica se o registro foi deletado (soft delete).
     * @returns true se foi deletado, false caso contrário.
     */
    public isDeletado(): boolean {
        return this._deletadoEm !== null && this._deletadoPor !== '';
    }

    /**
     * Controla a serialização para JSON.
     */
    public toJSON() {
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