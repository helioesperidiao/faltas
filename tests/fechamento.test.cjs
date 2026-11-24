const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RelatorioService } = require('../dist/services/RelatorioService');

const dia = new Date('2026-11-16T00:00:00Z');
const aluno = { matricula: '100', alunoNome: 'Ana', turma: '1A', paiEmail: 'pai@example.test' };
const registro = (falta = false, situacao = 'Normal') => ({ idRegistro:'1', matricula:'100', alunoNome:'Ana', turma:'1A', codDisciplina:'GERAL', falta, situacao, dia, ano:2026, auditoria: { criadoEm: dia, alteradoEm: null } });
const grade = ['07:00','07:50','08:40'].map((horaInicio,i) => ({ turma:'1A', dia:'segunda-feira', horaInicio, cod:`D${i}` }));
const movimento = (tipo, horario, motivo = 'atestado') => ({ matricula:'100', nomeAluno:'Ana', tipo, horario, data:dia, motivo });
function service(registros = [], movimentos = [], abonos = [], grades = grade) {
  return new RelatorioService(
    { findAll: async () => [aluno], findAllDeleted: async () => [] },
    { findAll: async () => registros },
    { findAll: async () => movimentos },
    { findAll: async () => grades }, {}, {}, { findAll: async () => abonos }
  );
}
test('entrada e saída geram aulas parciais sem duplicação e preservam motivo', async () => {
  const entrada = movimento('entrada','07:50');
  const saida = movimento('saida','08:40','bilhete');
  const f = await service([registro(false)], [entrada, entrada, saida], [], [...grade, grade[0]]).fechamentoDia(dia);
  assert.deepEqual(f.aulasAtrasados.map(x => x.horarioInicio), ['07:00']);
  assert.deepEqual(f.aulasAntecipados.map(x => x.horarioInicio), ['08:40']);
  assert.equal(f.aulasGeral.length, 2);
  assert.equal(f.aulasAtrasados[0].motivo, 'atestado');
  assert.equal(f.aulasAntecipados[0].motivo, 'bilhete');
  assert.equal(f.aulasFaltasDia.length, 0);
});
test('abono aprovado cobre todo o dia mesmo sem chamada e inclui extremos do período', async () => {
  const abono = { matricula:'100', alunoNome:'Ana', turma:'1A', status:'Aprovado', dataInicio:dia, dataFim:dia };
  const f = await service([], [], [abono]).fechamentoDia(dia);
  assert.equal(f.aulasGeral.length, 3);
  assert.equal(f.aulasFaltasDia.length, 3);
  assert.equal(f.faltasDoDia.length, 1);
  const pendente = await service([], [], [{ ...abono, status:'Pendente' }]).fechamentoDia(dia);
  assert.equal(pendente.aulasGeral.length, 0);
});
test('faltas abonadas existentes entram no CSV e dispensas não entram', async () => {
  const f = await service([registro(true, 'Abonada')]).fechamentoDia(dia);
  assert.equal(f.aulasGeral.length, 3);
  assert.equal(f.aulasFaltasDia.length, 3);
  const d = await service([registro(true, 'Dispensada')]).fechamentoDia(dia);
  assert.equal(d.aulasGeral.length, 0);
});
test('turmas sem grade são sinalizadas em vez de gerar arquivo incompleto', async () => {
  const f = await service([registro(true)], [], [], []).fechamentoDia(dia);
  assert.deepEqual(f.turmasSemGrade, ['1A']);
});
