import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import XLSX from 'xlsx';
const codigo = readFileSync(new URL('../src/public/js/ImportadorCsv.js', import.meta.url), 'utf8');
const { ESQUEMAS_IMPORTACAO, prepararImportacao, normalizarLinhaGradeHorario, lerArquivoPlanilha } = await import(`data:text/javascript;base64,${Buffer.from(codigo).toString('base64')}`);

test('CSV com colunas em ordem diferente e valores entre aspas', () => {
  const texto = 'TURMA_PREF;NOME_COMPL;ALUNO\n1ADM;"Ana; Souza";12345678';
  const resultado = prepararImportacao(texto, ESQUEMAS_IMPORTACAO.alunos, ['matricula','alunoNome','turma']);
  assert.deepEqual(resultado.ausentes, []);
  assert.equal(resultado.linhas[0].alunoNome, 'Ana; Souza');
  assert.equal(resultado.linhas[0].matricula, '12345678');
});

test('cabeçalho vazio não corresponde a colunas obrigatórias ausentes', () => {
  const resultado = prepararImportacao('TURMA;\n1ADM;', ESQUEMAS_IMPORTACAO.alunos, ['matricula','alunoNome','turma']);
  assert.deepEqual(resultado.ausentes.sort(), ['alunoNome','matricula']);
});

test('grade separa horário e dia ao importar planilha', () => {
  const texto = 'TURMA;DISCIPLINA;NOME_DESCIPLINA;SEMANA_EXTENSO;HORAINICIALFINAL\n1ADM;MAT;Matemática;quarta-feira;10:50-11:40';
  const resultado = prepararImportacao(texto, ESQUEMAS_IMPORTACAO.gradeHorarios, ['turma','cod','disciplina','dia','horaInicio','horaFim'], normalizarLinhaGradeHorario);
  assert.deepEqual(resultado.ausentes, []);
  assert.equal(resultado.linhas[0].dia, 'quarta');
  assert.equal(resultado.linhas[0].horaInicio, '10:50');
  assert.equal(resultado.linhas[0].horaFim, '11:40');
});

test('leitura de arquivo Excel preserva colunas e acentuação', async () => {
  globalThis.window = {XLSX};
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['ALUNO','NOME_COMPL','TURMA_PREF'],['42','João','1ADM']]), 'Alunos');
  const bytes = XLSX.write(wb, {type:'buffer',bookType:'xlsx'});
  const texto = await lerArquivoPlanilha({name:'alunos.xlsx', arrayBuffer: async () => bytes});
  const resultado = prepararImportacao(texto, ESQUEMAS_IMPORTACAO.alunos, ['matricula','alunoNome','turma']);
  assert.equal(resultado.linhas[0].alunoNome, 'João');
  assert.equal(resultado.linhas[0].matricula, '42');
});
