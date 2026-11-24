/**
 * Dias do calendário da escola.
 *
 * A chamada grava cada dia como meia-noite UTC de `AAAA-MM-DD`. Um instante (o momento
 * do cadastro de um aluno, por exemplo) precisa virar o dia do calendário em que ele
 * aconteceu NA ESCOLA: um aluno cadastrado às 22h de 17/11 em Brasília já é 18/11 em UTC,
 * mas pertence ao dia 17/11.
 */
export const FUSO_ESCOLA = "America/Sao_Paulo";

// Criado uma vez: montar um Intl.DateTimeFormat é caro e esta conversão roda por aluno.
const formatoDia = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_ESCOLA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
});

/** Dia da escola em que o instante caiu, como milissegundos da meia-noite UTC desse dia. */
export function diaEscolar(instante: Date): number {
    const [ano, mes, dia] = formatoDia.format(instante).split("-").map(Number);
    return Date.UTC(ano, mes - 1, dia);
}

/** Dia gravado pela chamada (`AAAA-MM-DD` à meia-noite UTC), como milissegundos. */
export function diaGravado(data: Date): number {
    return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}
