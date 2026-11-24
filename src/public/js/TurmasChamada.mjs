const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Agrupa pelo nome sem os números e ordena os números em ordem crescente (1adm, 2adm, 10adm, 1quim).
const compararTurmas = (a, b) => {
  const grupoA = normalizar(a).replace(/\d+/g, '');
  const grupoB = normalizar(b).replace(/\d+/g, '');
  return grupoA.localeCompare(grupoB, 'pt-BR') || a.localeCompare(b, 'pt-BR', { numeric: true });
};

/**
 * Turmas da chamada: as turmas distintas dos alunos ativos, isto é, a coluna de turma
 * da planilha de alunos importada. Cada turma aparece uma vez, com o nome exatamente como
 * está no cadastro, para que a busca dos alunos e o registro da falta usem a mesma turma.
 */
export function turmasDosAlunos(alunos) {
  const turmas = new Set();
  for (const aluno of alunos) {
    const turma = typeof aluno?.turma === 'string' ? aluno.turma.trim() : '';
    if (turma) turmas.add(turma);
  }
  return [...turmas].sort(compararTurmas);
}
