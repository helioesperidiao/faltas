import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const codigo = readFileSync(new URL('../src/public/js/ImportadorCsv.js', import.meta.url), 'utf8');
const { ESQUEMAS_IMPORTACAO, prepararImportacao, normalizarLinhaGradeHorario } =
  await import(`data:text/javascript;base64,${Buffer.from(codigo).toString('base64')}`);
const ALUNOS = ['matricula', 'alunoNome', 'turma'];

test('célula entre aspas com quebra de linha continua na mesma linha da planilha', () => {
  const texto = 'ALUNO;NOME_COMPL;TURMA_PREF\r\n123;"João\r\nda Silva";1A\r\n124;Maria;1A\r\n';
  const { linhas, ausentes } = prepararImportacao(texto, ESQUEMAS_IMPORTACAO.alunos, ALUNOS);
  assert.deepEqual(ausentes, []);
  assert.equal(linhas.length, 2);
  assert.equal(linhas[0].alunoNome, 'João da Silva');
  assert.equal(linhas[1].matricula, '124');
  // A mensagem de erro aponta a linha real do arquivo, mesmo depois da célula de duas linhas.
  assert.equal(linhas[1].__linha, 4);
});

test('linhas em branco e só com separadores são ignoradas', () => {
  const texto = 'ALUNO;NOME_COMPL;TURMA_PREF\n\n123;Ana;1A\n;;\n  \n124;Bia;1B\n;;;';
  const { linhas } = prepararImportacao(texto, ESQUEMAS_IMPORTACAO.alunos, ALUNOS);
  assert.deepEqual(linhas.map(l => l.matricula), ['123', '124']);
  assert.deepEqual(linhas.map(l => l.__linha), [3, 6]);
});

test('sem a coluna ALUNO a matrícula fica ausente, sem ler outra coluna no lugar', () => {
  const texto = 'NOME_COMPL;TURMA_PREF;ALUNO_DT_NASC\nAna;1A;01/01/2010';
  assert.deepEqual(prepararImportacao(texto, ESQUEMAS_IMPORTACAO.alunos, ALUNOS).ausentes, ['matricula']);
});

test('arquivo só com cabeçalho é planilha vazia, não cabeçalho ausente', () => {
  assert.deepEqual(prepararImportacao('ALUNO;NOME_COMPL\n', ESQUEMAS_IMPORTACAO.alunos, ALUNOS),
    { linhas: [], cabecalhos: [], mapeamento: {}, ausentes: [] });
});

test('intervalos de horário da grade em vários formatos', () => {
  for (const [entrada, inicio, fim] of [['07h30-08h20', '07:30', '08:20'], ['7-8', '07:00', '08:00'], ['10:50 – 11:40', '10:50', '11:40']]) {
    const linha = normalizarLinhaGradeHorario({ horaInicio: entrada, horaFim: entrada, dia: 'segunda-feira' });
    assert.equal(linha.horaInicio, inicio, entrada);
    assert.equal(linha.horaFim, fim, entrada);
  }
});
