const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('CSV de abonos seleciona somente aprovados sobrepostos e preserva os campos', async () => {
  const html = readFileSync('src/public/Abonos.html','utf8').replace(/\r\n/g, '\n');
  const inicio = html.indexOf("    document.getElementById('csvAbonos').addEventListener");
  const fim = html.indexOf('\n\n    let API_DATA;', inicio);
  assert.ok(inicio >= 0 && fim > inicio);
  let handler, arquivo;
  const elementos = { csvInicio:{value:'2026-10-18'}, csvFim:{value:'2026-11-18'}, csvResposta:{textContent:''}, csvAbonos:{addEventListener:(_evento, fn) => { handler = fn; }} };
  const dados = [
    { matricula:'1', alunoNome:'Ana', motivo:'Atestado; "médico"', status:'Aprovado', dataInicio:'2026-10-01', dataFim:'2026-10-18' },
    { matricula:'2', alunoNome:'Bia', motivo:'Pendente', status:'Pendente', dataInicio:'2026-11-01', dataFim:'2026-11-02' },
    { matricula:'3', alunoNome:'Caio', motivo:'Fora', status:'Aprovado', dataInicio:'2026-11-19', dataFim:'2026-11-20' }
  ];
  const contexto = { document:{getElementById:id=>elementos[id],createElement:()=>({click(){}})}, api:{get:async()=>({success:true,data:{abonos:dados}})}, Blob, URL:{createObjectURL:b=>{arquivo=b;return 'blob:teste';},revokeObjectURL(){}}, setTimeout:()=>0 };
  vm.runInNewContext(html.slice(inicio,fim),contexto);
  await handler();
  const csv = await arquivo.text();
  assert.match(csv, /"Matrícula";"Nome";"Motivo";"Período"/);
  assert.match(csv, /"1";"Ana";"Atestado; ""médico""";"01\/10\/2026 - 18\/10\/2026"/);
  assert.doesNotMatch(csv, /Bia|Caio/);
  assert.equal(elementos.csvResposta.textContent,'1 abono(s) incluído(s).');
  elementos.csvInicio.value = '2026-12-01'; await handler();
  assert.equal(elementos.csvResposta.textContent, 'Informe um período válido.');
});
