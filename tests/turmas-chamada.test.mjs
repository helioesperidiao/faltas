import { test } from 'node:test';
import assert from 'node:assert/strict';
import { turmasDosAlunos } from '../src/public/js/TurmasChamada.mjs';

const itens = (...nomes) => nomes.map(turma => ({ turma }));

test('turmas dos alunos: uma opção por turma, sem vazias e sem espaços em volta', () => {
  assert.deepEqual(turmasDosAlunos([...itens('2A', ' 2A ', '2C', '', '   ', '2C'), {}, { turma: null }]), ['2A', '2C']);
  assert.deepEqual(turmasDosAlunos([]), []);
});

test('agrupa turmas pelo nome e ordena os anos numericamente', () => {
  const resultado = turmasDosAlunos(itens('2quim', '3adm', '1quim', '2adm', '1adm', '10adm'));
  assert.deepEqual(resultado, ['1adm', '2adm', '3adm', '10adm', '1quim', '2quim']);
});

test('nomes diferentes na planilha continuam turmas diferentes (a busca dos alunos é pelo nome exato)', () => {
  assert.deepEqual(turmasDosAlunos(itens('EConInf-3PMA', 'ETecInf-3PMA', '1 A', '1A')), ['1 A', '1A', 'EConInf-3PMA', 'ETecInf-3PMA']);
});
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const ANA = { matricula: '123', alunoNome: 'Ana', turma: 'ETecInf-3PMA' };

async function iniciarTela(falharChamada = false, registrosSalvos = null, alunosDaTurma = null, alunosDaEscola = [ANA, { matricula: '999', alunoNome: 'Zé', turma: 'ForaDaGrade' }]) {
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
      if (url === 'api/v1/alunos') return { success: true, data: { alunos: alunosDaEscola } };
      if (url.startsWith('api/v1/alunos/turma/')) {
        const turma = decodeURIComponent(url.slice('api/v1/alunos/turma/'.length));
        return { success: true, data: { alunos: alunosDaTurma ?? alunosDaEscola.filter(aluno => aluno.turma === turma) } };
      }
      if (url.startsWith('api/v1/registros/chamada?')) return falharChamada ? { success: false } : { success: true, data: { registros: registrosSalvos ?? [{ matricula: '123', falta: true, idRegistro: 'existente' }] } };
      throw Error(url);
    }
    async put(url, id, objeto) { chamadas.push({ url, id, objeto }); return { success: true }; }
    async post(url, objeto) {
      if (!registrosSalvos) throw Error('Não deve criar chamada duplicada');
      chamadas.push({ url, objeto, metodo: 'POST' });
      await new Promise(resolve => setImmediate(resolve));
      return { success: true, data: { registros: [{ idRegistro: 'novo' }] } };
    }
  }
  const html = readFileSync(new URL('../src/public/telaChamada.html', import.meta.url), 'utf8');
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;\s*$/gm, '');
  const window = { alert() {}, confirm: () => true };
  runInNewContext(script, { document, window, ApiService, turmasDosAlunos, exigirSessao: () => ({ token: 'teste' }), montarTopbar() {}, escaparHtml: x => x, setTimeout() {}, console });
  await new Promise(resolve => setImmediate(resolve));
  return { document, window, chamadas };
}

// Planilha com 20 alunos do 2A e 10 do 2C (alguns com espaços em volta do nome da turma).
const planilha = [
  ...Array.from({ length: 20 }, (_, i) => ({ matricula: `A${i}`, alunoNome: `Aluno A${i}`, turma: i % 5 === 0 ? ' 2A ' : '2A' })),
  ...Array.from({ length: 10 }, (_, i) => ({ matricula: `C${i}`, alunoNome: `Aluno C${i}`, turma: '2C' }))
];

test('o seletor lista as turmas da planilha de alunos, sem repetir, e cada turma abre só os seus alunos', async () => {
  const alunos = planilha.map(aluno => ({ ...aluno, turma: aluno.turma.trim() }));
  const { document, window, chamadas } = await iniciarTela(false, [], null, alunos);
  const select = document.getElementById('turma-select');
  assert.deepEqual(select.children.map(opcao => opcao.value), ['2A', '2C']);
  assert.ok(!chamadas.includes('api/v1/gradehorarios'), 'a grade não define as turmas da chamada');
  document.getElementById('data-chamada').value = '2026-03-02';
  select.value = '2A';
  await window.selecionarTurma();
  assert.equal(document.getElementById('sum-total').innerHTML, 20);
  assert.ok(chamadas.some(url => typeof url === 'string' && url.startsWith('api/v1/registros/chamada?turma=2A&')));
  select.value = '2C';
  await window.selecionarTurma();
  assert.equal(document.getElementById('sum-total').innerHTML, 10);
  await window.marcarFalta();
  const falta = chamadas.find(item => item?.metodo === 'POST');
  assert.ok(falta.objeto.registro.matricula.startsWith('C'), 'a falta é do aluno da turma selecionada');
});

test('turma que só existe na planilha de alunos aparece; a grade não é consultada', async () => {
  const { document } = await iniciarTela();
  const opcoes = document.getElementById('turma-select').children.map(opcao => opcao.value);
  assert.deepEqual(opcoes, ['ETecInf-3PMA', 'ForaDaGrade']);
});

test('a chamada recupera e atualiza o registro já salvo da turma escolhida', async () => {
  const { document, window, chamadas } = await iniciarTela();
  const select = document.getElementById('turma-select');
  select.value = 'ETecInf-3PMA';
  await window.selecionarTurma();
  assert.ok(chamadas.includes('api/v1/alunos/turma/ETecInf-3PMA'));
  assert.ok(chamadas.some(url => typeof url === 'string' && url.startsWith('api/v1/registros/chamada?turma=ETecInf-3PMA&')));
  assert.equal(document.getElementById('sum-absent').innerHTML, 1);
  await window.salvarChamada();
  const atualizacao = chamadas.find(item => typeof item === 'object');
  assert.equal(atualizacao.id, 'existente');
  assert.equal(atualizacao.url, 'api/v1/registros');
});

test('a chamada não pode começar se a consulta dos registros falhar', async () => {
  const { document, window } = await iniciarTela(true);
  document.getElementById('turma-select').value = 'ETecInf-3PMA';
  await window.selecionarTurma();
  assert.equal(document.getElementById('btn-comecar-chamada').style.display, 'none');
  assert.match(document.getElementById('turma-aviso').textContent, /Não foi possível carregar a chamada/);
});

test('clique duplo em Faltou cria um único registro e corrige o mesmo via PUT', async () => {
  const { document, window, chamadas } = await iniciarTela(false, []);
  document.getElementById('turma-select').value = 'ETecInf-3PMA';
  document.getElementById('data-chamada').value = '2026-03-02';
  await window.selecionarTurma();
  await Promise.all([window.marcarFalta(), window.marcarFalta()]);
  await window.salvarChamada();
  const posts = chamadas.filter(item => item?.metodo === 'POST');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, 'api/v1/registros');
  assert.equal(posts[0].objeto.registro.falta, true);
  assert.equal(chamadas.find(item => typeof item === 'object' && !item.metodo).id, 'novo');
});

test('limpar a chamada devolve para presença, no banco, a falta já salva', async () => {
  const { document, window, chamadas } = await iniciarTela();
  document.getElementById('turma-select').value = 'ETecInf-3PMA';
  document.getElementById('data-chamada').value = '2026-03-02';
  await window.selecionarTurma();
  assert.equal(document.getElementById('sum-absent').innerHTML, 1);
  await window.limparChamada();
  const correcao = chamadas.find(item => typeof item === 'object' && item.id === 'existente');
  assert.ok(correcao, 'a falta salva deve ser corrigida via PUT');
  assert.equal(correcao.objeto.registro.falta, false);
});

test('a chamada não lista aluno que entrou na turma depois da data escolhida', async () => {
  const { document, window } = await iniciarTela(false, [], [
    { matricula: '123', alunoNome: 'Ana', turmaInicioEm: '2026-01-01T03:00:00.000Z' },
    // Cadastrada às 22h de 05/03 em Brasília (já 06/03 em UTC): entra no dia 05/03.
    { matricula: '456', alunoNome: 'Bia', turmaInicioEm: '2026-03-06T01:00:00.000Z' }
  ]);
  document.getElementById('turma-select').value = 'ETecInf-3PMA';
  document.getElementById('data-chamada').value = '2026-03-04';
  await window.selecionarTurma();
  assert.equal(document.getElementById('sum-total').innerHTML, 1);
  assert.match(document.getElementById('turma-aviso').textContent, /1 aluno\(s\) entraram na turma depois desta data/);
  document.getElementById('data-chamada').value = '2026-03-05';
  await window.selecionarTurma();
  assert.equal(document.getElementById('sum-total').innerHTML, 2);
});

test('navegar durante a gravação da falta não avança nem desfaz o aluno errado', async () => {
  const alunos = ['123', '456', '789', '012'].map((matricula, i) => ({ matricula, alunoNome: 'Aluno ' + i }));
  const { document, window, chamadas } = await iniciarTela(false, [], alunos);
  document.getElementById('turma-select').value = 'ETecInf-3PMA';
  document.getElementById('data-chamada').value = '2026-03-02';
  await window.selecionarTurma();
  const gravando = window.marcarFalta();           // falta do aluno 1 (índice 0)
  window.irParaAluno(2);                            // professor navega durante a gravação
  await gravando;
  assert.equal(document.getElementById('student-count').textContent, 'Aluno 3 de 4');
  const post = chamadas.find(item => item?.metodo === 'POST');
  assert.equal(post.objeto.registro.matricula, '123');
});

test('trocar a data durante o Limpar não grava na chamada nova', async () => {
  const { document, window, chamadas } = await iniciarTela(false, [
    { matricula: '123', falta: true, idRegistro: 'existente' }
  ]);
  document.getElementById('turma-select').value = 'ETecInf-3PMA';
  document.getElementById('data-chamada').value = '2026-03-02';
  await window.selecionarTurma();
  const limpando = window.limparChamada();
  document.getElementById('data-chamada').value = '2026-03-09';
  await window.selecionarTurma();
  await limpando;
  const correcoes = chamadas.filter(item => typeof item === 'object' && !item.metodo);
  assert.ok(correcoes.length >= 1);
  for (const c of correcoes) assert.equal(c.objeto.registro.dia, '2026-03-02');
});
