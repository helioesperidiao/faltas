const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const equivalente = valor => normalizar(valor).replace(/^(etec|econ)/, '');
const temSiglaLegada = valor => /^(etec|econ)/.test(normalizar(valor));

// A grade define as opções; só associa uma turma de alunos quando o vínculo é inequívoco.
export function vincularTurmasDaGrade(grades, alunos) {
  const turmasGrade = [...new Set(grades.map(item => typeof item.turma === 'string' ? item.turma.trim() : '').filter(Boolean))]
    .sort((a, b) => {
      const grupoA = normalizar(a).replace(/\d+/g, '');
      const grupoB = normalizar(b).replace(/\d+/g, '');
      return grupoA.localeCompare(grupoB, 'pt-BR') || a.localeCompare(b, 'pt-BR', { numeric: true });
    });
  const turmasAlunos = [...new Set(alunos.map(item => typeof item.turma === 'string' ? item.turma : '').filter(turma => turma.trim()))];
  return turmasGrade.map(turma => {
    if (turmasGrade.filter(nome => normalizar(nome) === normalizar(turma)).length > 1) {
      return { turma, turmaAlunos: null, ambiguo: true };
    }
    const exatas = turmasAlunos.filter(nome => normalizar(nome) === normalizar(turma));
    if (exatas.length === 1) return { turma, turmaAlunos: exatas[0] };
    if (exatas.length > 1) return { turma, turmaAlunos: null, ambiguo: true };
    const alternativas = temSiglaLegada(turma)
      ? turmasAlunos.filter(nome => temSiglaLegada(nome) && equivalente(nome) === equivalente(turma))
      : [];
    const gradesEquivalentes = turmasGrade.filter(nome => temSiglaLegada(nome) && equivalente(nome) === equivalente(turma));
    if (alternativas.length === 1 && gradesEquivalentes.length === 1) return { turma, turmaAlunos: alternativas[0] };
    return { turma, turmaAlunos: null, ambiguo: alternativas.length > 0 };
  });
}
