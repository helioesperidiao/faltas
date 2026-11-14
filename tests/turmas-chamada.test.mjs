import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vincularTurmasDaGrade } from '../src/public/js/TurmasChamada.mjs';

const itens = (...nomes) => nomes.map(turma => ({ turma }));

test('as opções vêm apenas da grade, incluindo turmas sem alunos e sem duplicar aulas', () => {
  assert.deepEqual(vincularTurmasDaGrade(itens('B', 'A', 'A'), itens('A', 'C')), [
    { turma: 'A', turmaAlunos: 'A' }, { turma: 'B', turmaAlunos: null, ambiguo: false }
  ]);
});

test('agrupa turmas pelo nome e ordena os anos numericamente', () => {
  const resultado = vincularTurmasDaGrade(itens('2quim', '3adm', '1quim', '2adm', '1adm', '10adm'), []);
  assert.deepEqual(resultado.map(item => item.turma), ['1adm', '2adm', '3adm', '10adm', '1quim', '2quim']);
});

test('correspondência normalizada e siglas legadas únicas preservam o nome cadastrado no aluno', () => {
  assert.deepEqual(vincularTurmasDaGrade(itens('EConInf-3PMA', '1-A'), itens('ETecInf-3PMA', '1 a')), [
    { turma: '1-A', turmaAlunos: '1 a' }, { turma: 'EConInf-3PMA', turmaAlunos: 'ETecInf-3PMA' }
  ]);
});

test('não associa siglas ou nomes ambíguos e prefere uma correspondência exata', () => {
  assert.deepEqual(vincularTurmasDaGrade(itens('EConInf-3PMA', 'ETecInf-3PMA'), itens('ETecInf-3PMA')), [
    { turma: 'EConInf-3PMA', turmaAlunos: null, ambiguo: true },
    { turma: 'ETecInf-3PMA', turmaAlunos: 'ETecInf-3PMA' }
  ]);
  assert.equal(vincularTurmasDaGrade(itens('1-A'), itens('1 A', '1A'))[0].ambiguo, true);
  assert.ok(vincularTurmasDaGrade(itens('1-A', '1 A'), itens('1-A')).every(item => item.ambiguo));
});
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

async function iniciarTela(falharChamada = false) {
  const elementos = new Map();
  const elemento = () => ({
    value: '', style: {}, textContent: '', innerHTML: '', children: [],
    classList: { add() {}, remove() {} },
    appendChild(filho) { this.children.push(filho); }, append(...filhos) { this.children.push(...filhos); },
    addEventListener() {}, setAttribute() {}
  });
  const document = {
    getElementById(id) { if (!elementos.has(id)) elementos.set(id, elemento()); return elementos.get(id); },
    createElement: elemento, body: elemento()
  };
  const chamadas = [];
  class ApiService {
    async get(url) {
      chamadas.push(url);
      if (url === 'api/v1/gradehorarios') return { success: true, data: { gradeHorarios: itens('EConInf-3PMA', 'Outra') } };
      if (url === 'api/v1/alunos') return { success: true, data: { alunos: itens('ETecInf-3PMA', 'ForaDaGrade') } };
      if (url.startsWith('api/v1/alunos/turma/')) return { success: true, data: { alunos: [{ matricula: '123', alunoNome: 'Ana' }] } };
      if (url.startsWith('api/v1/registro/chamada?')) return falharChamada ? { success: false } : { success: true, data: { registros: [{ matricula: '123', falta: true, idRegistro: 'existente' }] } };
      throw Error(url);
    }
    async put(url, id, objeto) { chamadas.push({ url, id, objeto }); return { success: true }; }
    async post() { throw Error('Não deve criar chamada duplicada'); }
  }
  const html = readFileSync(new URL('../src/public/telaChamada.html', import.meta.url), 'utf8');
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;\s*$/gm, '');
  const window = { alert() {}, confirm: () => true };
  runInNewContext(script, { document, window, ApiService, vincularTurmasDaGrade, exigirSessao: () => ({ token: 'teste' }), montarTopbar() {}, escaparHtml: x => x, setTimeout() {}, console });
  await new Promise(resolve => setImmediate(resolve));
  return { document, window, chamadas };
}

test('a chamada usa a turma da grade, recupera e atualiza o registro da turma legada', async () => {
  const { document, window, chamadas } = await iniciarTela();
  const select = document.getElementById('turma-select');
  assert.deepEqual(select.children.map(opcao => opcao.value), ['EConInf-3PMA', 'Outra']);
  select.value = 'EConInf-3PMA';
  await window.selecionarTurma();
  assert.ok(chamadas.includes('api/v1/alunos/turma/ETecInf-3PMA'));
  assert.ok(chamadas.some(url => typeof url === 'string' && url.startsWith('api/v1/registro/chamada?turma=ETecInf-3PMA&')));
  assert.equal(document.getElementById('sum-absent').innerHTML, 1);
  await window.salvarChamada();
  assert.equal(chamadas.find(item => typeof item === 'object').id, 'existente');
});

test('a chamada não pode começar se a consulta dos registros falhar', async () => {
  const { document, window } = await iniciarTela(true);
  document.getElementById('turma-select').value = 'EConInf-3PMA';
  await window.selecionarTurma();
  assert.equal(document.getElementById('btn-comecar-chamada').style.display, 'none');
  assert.match(document.getElementById('turma-aviso').textContent, /Não foi possível carregar a chamada/);
});
