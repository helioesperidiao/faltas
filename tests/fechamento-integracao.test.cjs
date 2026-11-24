const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, mkdirSync, readFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { MongoClient } = require('mongodb');

const root = path.resolve(__dirname, '..');
const mongoExe = process.env.MONGOD_BINARY;
let mongo, server, mongoClient, base, token;
const shared = {};
const pausa = ms => new Promise(resolve => setTimeout(resolve, ms));
async function portaLivre() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.on('error', reject).listen(0, '127.0.0.1', () => {
      const port = listener.address().port;
      listener.close(() => resolve(port));
    });
  });
}
async function requisicao(method, url, body, auth = token) {
  const response = await fetch(base + url, {
    method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: response.status, json };
}
function validar(response, status, acao) {
  assert.equal(response.status, status, `${acao}: ${response.status} ${JSON.stringify(response.json)}`);
  if (response.json && typeof response.json === 'object' && status < 300) assert.equal(response.json.success, true, acao);
  return response.json?.data;
}

before(async () => {
  assert.ok(mongoExe, 'Defina MONGOD_BINARY com o caminho do mongod para executar a integração.');
  const temp = mkdtempSync(path.join(os.tmpdir(), 'faltas-integracao-'));
  const mongoDir = path.join(temp, 'db'); mkdirSync(mongoDir); mkdirSync(path.join(temp, 'logs'));
  const mongoPort = await portaLivre(); const appPort = await portaLivre();
  mongo = spawn(mongoExe, ['--dbpath', mongoDir, '--bind_ip', '127.0.0.1', '--port', String(mongoPort), '--quiet'], { stdio: 'ignore', windowsHide: true });
  for (let i = 0; i < 60; i++) {
    try { mongoClient = new MongoClient(`mongodb://127.0.0.1:${mongoPort}`, { serverSelectionTimeoutMS: 500 }); await mongoClient.connect(); break; }
    catch { await mongoClient?.close(); mongoClient = null; await pausa(250); }
  }
  assert.ok(mongoClient, 'MongoDB isolado não iniciou');
  base = `http://127.0.0.1:${appPort}`;
  const env = { ...process.env, MONGO_URI: `mongodb://127.0.0.1:${mongoPort}`, MONGO_DATABASE: 'teste_isolado', PORT: String(appPort), JWT_SECRET: 'segredo-exclusivo-para-teste-local', DEFAULT_ADMIN_NAME: 'Admin Teste', DEFAULT_ADMIN_EMAIL: 'admin@example.test', DEFAULT_ADMIN_PASSWORD: 'teste-seguro-123', LOG_LEVEL: 'error', NODE_ENV: 'test' };
  server = spawn(process.execPath, [path.join(root, 'dist/index.js')], { cwd: temp, env, stdio: 'ignore', windowsHide: true });
  let login;
  for (let i = 0; i < 80; i++) {
    try { login = await requisicao('POST', '/api/v1/funcionarios/login', { funcionario: { email: 'admin@example.test', senha: 'teste-seguro-123' } }, ''); if (login.status === 200) break; }
    catch { /* servidor ainda iniciando */ }
    await pausa(250);
  }
  assert.equal(login?.status, 200, 'servidor e login de teste devem iniciar');
  token = login.json.data.token;
  assert.ok(token);
});
after(async () => { await mongoClient?.close(); server?.kill(); mongo?.kill(); });

test('fechamento, anexo e abono na API com banco isolado', async () => {
  const aluno = { matricula:'12345678', alunoNome:'Aluno Teste', turma:'1A', curso:'Teste', serie:'1', ano:'2026', paiEmail:'pai@example.test' };
  validar(await requisicao('POST','/api/v1/alunos',{ aluno }),201,'criar aluno');
  await mongoClient.db('teste_isolado').collection('aluno').updateOne({ matricula: aluno.matricula }, { $set: { turmaInicioEm: new Date('2026-01-01T03:00:00Z') } });
  const gradeHorario = { turma:'1A', horaInicio:'07:00', horaFim:'07:50', dia:'Segunda-feira', cod:'MAT', disciplina:'Matemática' };
  validar(await requisicao('POST','/api/v1/gradehorarios',{gradeHorario}),201,'criar grade');
  const mov = { nomeAluno:aluno.alunoNome, matricula:aluno.matricula, data:'2026-11-16', horario:'07:50', tipo:'entrada', motivo:'atestado' };
  const primeira = validar(await requisicao('POST','/api/v1/movimentacoes/lote',{movimentacoes:[mov]}),201,'criar entrada').movimentacoes[0];
  const repetida = validar(await requisicao('POST','/api/v1/movimentacoes/lote',{movimentacoes:[mov]}),201,'repetir entrada').movimentacoes[0];
  assert.equal(primeira.idMovimentacao,repetida.idMovimentacao);
  validar(await requisicao('POST','/api/v1/movimentacoes/lote',{movimentacoes:[{...mov,motivo:'bilhete'}]}),201,'corrigir motivo');
  assert.equal(validar(await requisicao('GET','/api/v1/movimentacoes?data=2026-11-16'),200,'motivo corrigido').movimentacoes[0].motivo,'bilhete');
  validar(await requisicao('POST','/api/v1/movimentacoes/lote',{movimentacoes:[mov]}),201,'restaurar motivo');
  const listagem = validar(await requisicao('GET','/api/v1/movimentacoes?data=2026-11-16'),200,'listar').movimentacoes;
  assert.equal(listagem.length,1); assert.equal(listagem[0].motivo,'atestado');
  const form = new FormData(); form.append('arquivo', new Blob([Buffer.from([137,80,78,71,13,10,26,10])], {type:'image/png'}), 'imagem.png');
  const upload = await fetch(`${base}/api/v1/movimentacoes/${primeira.idMovimentacao}/arquivo`, {method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});
  assert.equal(upload.status,200,await upload.text());
  const atualizada = validar(await requisicao('GET','/api/v1/movimentacoes?data=2026-11-16'),200,'listar imagem').movimentacoes[0];
  try {
    assert.ok(atualizada.nomeArquivo);
    const semToken = await fetch(`${base}/api/v1/movimentacoes/${primeira.idMovimentacao}/arquivo`); assert.equal(semToken.status,401);
    const download = await fetch(`${base}/api/v1/movimentacoes/${primeira.idMovimentacao}/arquivo`,{headers:{Authorization:`Bearer ${token}`}});
    assert.equal(download.status,200); assert.equal((await download.arrayBuffer()).byteLength,8);
  } finally { require('node:fs').unlinkSync(path.join(root,'uploads','movimentacao',atualizada.nomeArquivo)); }
  let fechamento = validar(await requisicao('GET','/api/v1/relatorios/fechamento-dia?data=2026-11-16'),200,'fechamento');
  assert.equal(fechamento.aulasAtrasados.length,1); assert.equal(fechamento.aulasGeral.length,1); assert.equal(fechamento.aulasAtrasados[0].motivo,'atestado');
  const registro = {ano:2026, codDisciplina:'GERAL', horaInicio:0, horaFim:0, matricula:aluno.matricula, falta:false, dia:'2026-11-16', atrasado:'Não'};
  const registroId = validar(await requisicao('POST','/api/v1/registros',{registro}),201,'registrar presença').registros[0].idRegistro;
  const abono = {matricula:aluno.matricula, dataInicio:'2026-11-16',dataFim:'2026-11-16',motivo:'Atestado'};
  const id = validar(await requisicao('POST','/api/v1/abonos',{abono}),201,'criar abono').abonos[0].idAbono;
  validar(await requisicao('PUT',`/api/v1/abonos/${id}/aprovar`,{}),200,'aprovar abono');
  let chamada = validar(await requisicao('GET','/api/v1/registros/chamada?turma=1A&dia=2026-11-16'),200,'consultar chamada').registros[0];
  assert.equal(chamada.falta,true); assert.equal(chamada.situacao,'Abonada');
  validar(await requisicao('PUT',`/api/v1/registros/${registroId}`,{registro:{falta:false,atrasado:'Não'}}),200,'corrigir chamada');
  chamada = validar(await requisicao('GET','/api/v1/registros/chamada?turma=1A&dia=2026-11-16'),200,'conferir chamada').registros[0];
  assert.equal(chamada.falta,true); assert.equal(chamada.situacao,'Abonada');
  validar(await requisicao('POST','/api/v1/registros',{registro:{...registro,falta:false}}),201,'reenvio da chamada abonada');
  chamada = validar(await requisicao('GET','/api/v1/registros/chamada?turma=1A&dia=2026-11-16'),200,'conferir reenvio abonado').registros[0];
  assert.equal(chamada.falta,true); assert.equal(chamada.situacao,'Abonada');
  fechamento = validar(await requisicao('GET','/api/v1/relatorios/fechamento-dia?data=2026-11-16'),200,'fechamento abonado');
  assert.equal(fechamento.aulasFaltasDia.length,1); assert.equal(fechamento.aulasGeral.length,1); assert.equal(fechamento.aulasAtrasados.length,1);
  const collection = mongoClient.db('teste_isolado').collection('movimentacao');
  const auditoria = {criadoPor:'teste', criadoEm:new Date(), deletadoEm:null};
  const original = await collection.findOne({matricula:aluno.matricula, horario:'07:50'});
  const { _id, ...duplicata } = original; void _id;
  await collection.insertOne({...duplicata});
  await collection.insertOne({...duplicata, horario:'08:40', auditoria:{...auditoria, deletadoEm:new Date()}});
  assert.equal(validar(await requisicao('GET','/api/v1/movimentacoes?data=2026-11-16'),200,'duplicatas históricas').movimentacoes.length,1);
  const muitos = Array.from({length:205}, (_,i) => ({nomeAluno:'Aluno Teste',matricula:aluno.matricula,data:new Date(Date.UTC(2025,0,i+1)),horario:'07:50',tipo:'entrada',auditoria}));
  await collection.insertMany(muitos);
  assert.ok(validar(await requisicao('GET','/api/v1/movimentacoes'),200,'leitura completa').movimentacoes.length >= 206);
});
