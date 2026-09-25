export const CARGO_INSPETOR = "Inspetor";
export const CARGO_PROCESSO_PEDAGOGICO = "Processo Pedagógico";

export const CARGOS_ACEITOS = [
    CARGO_INSPETOR,
    CARGO_PROCESSO_PEDAGOGICO
] as const;

export function normalizarNomeCargo(nome: string): string {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

export function cargoAceito(nome: string): boolean {
    return CARGOS_ACEITOS.some(cargo => normalizarNomeCargo(cargo) === normalizarNomeCargo(nome));
}

export function nomeCargoCanonico(nome: string): string | null {
    return CARGOS_ACEITOS.find(cargo => normalizarNomeCargo(cargo) === normalizarNomeCargo(nome)) || null;
}
