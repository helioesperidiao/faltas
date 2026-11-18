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

test('simulação HTTP com banco isolado', async t => {
  await t.test('páginas e autenticação', async () => {
    for (const page of ['Login.html','dashboard.html','telaChamada.html','telaAdministrador.html','Movimentacoes.html','Abonos.html','Alunos.html','GradeHorarios.html','Relatorios.html','AlertasFaltas.html','Cargos.html','Funcionarios.html']) {
      const response = await fetch(`${base}/${page}`); assert.equal(response.status, 200, page);
    }
    assert.equal((await requisicao('GET','/api/v1/alunos',undefined,'')).status,401);
    assert.notEqual((await requisicao('POST','/api/v1/funcionarios/login',{funcionario:{email:'admin@example.test',senha:'incorreta'}},'')).status,200);
  });
  await t.test('cargos e funcionários', async () => {
    const cargos = validar(await requisicao('GET','/api/v1/cargos'),200,'listar cargos').cargos;
    const inspetor = cargos.find(x => x.nomeCargo === 'Inspetor'); assert.ok(inspetor);
    const novo = validar(await requisicao('POST','/api/v1/funcionarios',{funcionario:{nomeFuncionario:'Inspetor Teste',email:'inspetor@example.test',senha:'123',recebeValeTransporte:0,cargo:{idCargo:inspetor.idCargo}}}),201,'cadastrar funcionário');
    shared.idFuncionario = novo.funcionario.idFuncionario; assert.ok(shared.idFuncionario);
    shared.tokenInspetor = validar(await requisicao('POST','/api/v1/funcionarios/login',{funcionario:{email:'inspetor@example.test',senha:'123'}},''),200,'login do inspetor').token;
    const funcionarios = validar(await requisicao('GET','/api/v1/funcionarios'),200,'listar funcionários').funcionarios;
    assert.ok(funcionarios.some(x => x.email === 'inspetor@example.test'));
  });
  await t.test('cadastro de alunos e grade', async () => {
    const aluno = {matricula:'12345678',alunoNome:'Aluno Teste',turma:'EConAdm-2PMB',curso:'Administração',serie:'2',ano:'2026',paiEmail:'pai@example.test'};
    shared.aluno = aluno;
    shared.idAluno = validar(await requisicao('POST','/api/v1/alunos',{aluno}),201,'cadastrar aluno').alunos[0].idAluno;
    // O aluno só conta a partir do dia em que entrou na turma (docs/chamada-e-relatorios.md).
    // As datas deste roteiro são fixas (16 e 17/11/2026), então ele entra no início do ano letivo.
    await mongoClient.db('teste_isolado').collection('aluno').updateOne({ matricula: aluno.matricula }, { $set: { turmaInicioEm: new Date('2026-01-01T03:00:00Z') } });
    const gradeHorario = {turma:aluno.turma,horaInicio:'07:00',horaFim:'07:50',dia:'Segunda-feira',cod:'ADM1',disciplina:'Administração'};
    shared.grade = gradeHorario;
    shared.idGrade = validar(await requisicao('POST','/api/v1/gradehorarios',{gradeHorario}),201,'cadastrar aula').gradeHorarios[0].idGradeHorario;
    assert.equal(validar(await requisicao('GET',`/api/v1/alunos/turma/${aluno.turma}`),200,'consultar alunos da turma').alunos.length,1);
    assert.equal(validar(await requisicao('GET','/api/v1/gradehorarios'),200,'listar grade').gradeHorarios.length,1);
  });
  await t.test('grade rejeita horários invertidos e respeita permissões', async () => {
    const invalida = {...shared.grade, horaInicio: '08:00', horaFim: '07:00'};
    assert.equal((await requisicao('POST','/api/v1/gradehorarios',{gradeHorario: invalida})).status, 400);
    assert.equal((await requisicao('PUT',`/api/v1/gradehorarios/${shared.idGrade}`,{gradeHorario: invalida})).status, 400);
    assert.equal((await requisicao('POST','/api/v1/gradehorarios/importacao/substituir',{gradeHorarios:[shared.grade, invalida]})).status, 400);
    assert.equal(validar(await requisicao('GET','/api/v1/gradehorarios'),200,'grade após importação inválida').gradeHorarios.length,1);
    assert.equal((await requisicao('POST','/api/v1/gradehorarios',{gradeHorario: shared.grade},shared.tokenInspetor)).status, 403);
    assert.equal((await requisicao('GET','/api/v1/alertas-faltas/configuracoes',undefined,shared.tokenInspetor)).status, 403);
  });
  await t.test('edição da grade pela tela e ApiService reais', async () => {
    const { runInNewContext } = require('node:vm');
    const html = readFileSync(path.join(root, 'src/public/GradeHorarios.html'), 'utf8');
    const endpoint = html.match(/api\.put\("([^"]+)", id, montarObjeto\(\)\)/)[1];
    const script = readFileSync(path.join(root, 'src/public/ApiService.js'), 'utf8')
      .replace('export default class ApiService', 'class ApiService') + '\nglobalThis.ApiService = ApiService;';
    const contexto = { window: {API_BASE_URL: base}, localStorage: {getItem() {return null;}}, fetch, console: {log() {}, error() {}} };
    runInNewContext(script, contexto);
    const api = new contexto.ApiService(token);
    const resposta = await api.put(endpoint, shared.idGrade, {gradeHorario: {...shared.grade, disciplina: 'Gestão'}});
    assert.ok(resposta?.success, `a tela deve atualizar a grade: ${JSON.stringify(resposta)}`);
    const grade = validar(await requisicao('GET','/api/v1/gradehorarios'),200,'consultar grade alterada').gradeHorarios[0];
    assert.equal(grade.disciplina, 'Gestão');
  });
  await t.test('chamada: consulta, gravação, recuperação e correção', async () => {
    const query = '?turma=EConAdm-2PMB&dia=2026-11-16';
    assert.equal(validar(await requisicao('GET','/api/v1/registros/chamada'+query),200,'chamada inicial').registros.length,0);
    const registro={ano:2026,codDisciplina:'GERAL',horaInicio:0,horaFim:0,matricula:'12345678',falta:true,dia:'2026-11-16',atrasado:'Não'};
    shared.idRegistro = validar(await requisicao('POST','/api/v1/registros',{registro}),201,'gravar falta').registros[0].idRegistro;
    assert.ok(shared.idRegistro);
    assert.equal(validar(await requisicao('GET','/api/v1/registros/chamada'+query),200,'recuperar falta').registros[0].falta,true);
    validar(await requisicao('PUT',`/api/v1/registros/${shared.idRegistro}`,{registro:{...registro,falta:false}}),200,'corrigir falta');
    const salvos=validar(await requisicao('GET','/api/v1/registros/chamada'+query),200,'recuperar correção').registros;
    assert.equal(salvos.length,1); assert.equal(salvos[0].falta,false);
    validar(await requisicao('PUT',`/api/v1/registros/${shared.idRegistro}`,{registro}),200,'restaurar falta');
  });
  await t.test('tela de chamada conectada às rotas reais', async () => {
    const { runInNewContext } = require('node:vm');
    const { pathToFileURL } = require('node:url');
    const { vincularTurmasDaGrade } = await import(pathToFileURL(path.join(root, 'src/public/js/TurmasChamada.mjs')));
    const elementos = new Map();
    const elemento = () => ({ value: '', style: {}, textContent: '', innerHTML: '', children: [],
      classList: {add() {}, remove() {}}, appendChild(filho) {this.children.push(filho);},
      append(...filhos) {this.children.push(...filhos);}, addEventListener() {}, setAttribute() {} });
    const document = { getElementById(id) {if (!elementos.has(id)) elementos.set(id, elemento()); return elementos.get(id);}, createElement: elemento, body: elemento() };
    class ApiTela {
      async get(url) {return (await requisicao('GET', '/' + url)).json;}
      async put(url, id, body) {return (await requisicao('PUT', '/' + url + '/' + id, body)).json;}
      async post(url, body) {return (await requisicao('POST', '/' + url, body)).json;}
    }
    const html = readFileSync(path.join(root, 'src/public/telaChamada.html'), 'utf8');
    let script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;\s*$/gm, '');
    script = script.replace('  carregarTurmas();', '  globalThis.inicializacaoTurmas = carregarTurmas();');
    const window = {alert: mensagem => {throw new Error(mensagem);}, confirm: () => true};
    const contexto = {document, window, ApiService: ApiTela, vincularTurmasDaGrade, exigirSessao: () => ({token}), montarTopbar() {}, escaparHtml: x => x, setTimeout() {}, console};
    runInNewContext(script, contexto);
    await contexto.inicializacaoTurmas;
    document.getElementById('data-chamada').value = '2026-11-16';
    const select = document.getElementById('turma-select');
    assert.ok(select.children.some(item => item.value === 'EConAdm-2PMB'));
    select.value = 'EConAdm-2PMB';
    await window.selecionarTurma();
    assert.equal(document.getElementById('btn-comecar-chamada').style.display, 'block');
    assert.equal(document.getElementById('sum-absent').innerHTML, 1);
    await window.salvarChamada();
    const registros = validar(await requisicao('GET','/api/v1/registros/chamada?turma=EConAdm-2PMB&dia=2026-11-16'),200,'verificar chamada').registros;
    assert.equal(registros.length, 1);
    assert.equal(registros[0].idRegistro, shared.idRegistro);
    assert.equal(registros[0].falta, true);
  });
  await t.test('relatórios, movimentações e fechamento diário', async () => {
    const frequencia=validar(await requisicao('GET','/api/v1/relatorios/frequencia?turma=EConAdm-2PMB&dia=2026-11-16'),200,'frequência').frequencia;
    assert.equal(frequencia[0].situacao,'Ausente');
    const mov={nomeAluno:'Aluno Teste',matricula:'12345678',data:'2026-11-16',horario:'07:50',tipo:'entrada'};
    validar(await requisicao('POST','/api/v1/movimentacoes/lote',{movimentacoes:[mov]}),201,'registrar entrada');
    assert.equal(validar(await requisicao('GET','/api/v1/movimentacoes?data=2026-11-16'),200,'listar entradas').movimentacoes.length,1);
    const fechamento = validar(await requisicao('GET','/api/v1/relatorios/fechamento-dia?data=2026-11-16'),200,'fechamento diário');
    assert.equal(fechamento.aulasAtrasados.length,1);
    assert.equal(fechamento.aulasAtrasados[0].matricula,'12345678');
    assert.equal(fechamento.aulasGeral.length,1);
    validar(await requisicao('GET','/api/v1/relatorios/faltas/mes?turma=EConAdm-2PMB&ano=2026&mes=11'),200,'faltas por mês');
    validar(await requisicao('GET','/api/v1/relatorios/faltas/semana?turma=EConAdm-2PMB&data=2026-11-16'),200,'faltas por semana');
    validar(await requisicao('GET','/api/v1/relatorios/faltas/periodo?turma=EConAdm-2PMB&dataInicio=2026-11-01&dataFim=2026-11-30'),200,'faltas por período');
  });
  await t.test('abono e preservação da situação ao corrigir a chamada', async () => {
    const abono={matricula:'12345678',dataInicio:'2026-11-16',dataFim:'2026-11-16',motivo:'Atestado de teste'};
    const id=validar(await requisicao('POST','/api/v1/abonos',{abono}),201,'criar abono').abonos[0].idAbono;
    assert.equal((await requisicao('PUT',`/api/v1/abonos/${id}/aprovar`,{},shared.tokenInspetor)).status,403);
    validar(await requisicao('PUT',`/api/v1/abonos/${id}/aprovar`,{}),200,'aprovar abono');
    assert.equal((await requisicao('PUT',`/api/v1/abonos/${id}/aprovar`,{})).status,400);
    let chamado=validar(await requisicao('GET','/api/v1/registros/chamada?turma=EConAdm-2PMB&dia=2026-11-16'),200,'consultar abonada').registros[0];
    assert.equal(chamado.situacao,'Abonada');
    validar(await requisicao('PUT',`/api/v1/registros/${shared.idRegistro}`,{registro:{falta:true,atrasado:'Não'}}),200,'corrigir chamada abonada');
    chamado=validar(await requisicao('GET','/api/v1/registros/chamada?turma=EConAdm-2PMB&dia=2026-11-16'),200,'consultar situação após correção').registros[0];
    assert.equal(chamado.situacao,'Abonada');
  });
  await t.test('dispensa vinculada ao aluno e registro dispensado', async () => {
    const dispensa = {idAluno: shared.idAluno,turma: shared.aluno.turma,horaInicio:7,horaFim:8,dia:'2026-11-17',dataFim:'2026-11-17',cod:'GERAL',disciplina:'Geral',motivo:'Teste'};
    const id = validar(await requisicao('POST','/api/v1/dispensas',{dispensa}),201,'cadastrar dispensa').dispensas[0].idDispensa;
    const registro={ano:2026,codDisciplina:'GERAL',horaInicio:0,horaFim:0,matricula:'12345678',falta:true,dia:'2026-11-17',atrasado:'Não'};
    const salvo = validar(await requisicao('POST','/api/v1/registros',{registro}),201,'chamada com dispensa').registros[0];
    assert.equal(salvo.situacao,'Dispensada'); assert.equal(salvo.falta,false);
    validar(await requisicao('PUT',`/api/v1/registros/${salvo.idRegistro}`,{registro}),200,'atualizar chamada dispensada');
    const recuperado=validar(await requisicao('GET','/api/v1/registros/chamada?turma=EConAdm-2PMB&dia=2026-11-17'),200,'recuperar dispensa').registros[0];
    assert.equal(recuperado.situacao,'Dispensada');
    validar(await requisicao('DELETE',`/api/v1/dispensas/${id}`),204,'excluir dispensa');
  });
  await t.test('configurações e alertas de faltas', async () => {
    const regras=validar(await requisicao('GET','/api/v1/alertas-faltas/configuracoes'),200,'listar regras').configuracoes;
    assert.ok(regras.length >= 2);
    const regra=validar(await requisicao('POST','/api/v1/alertas-faltas/configuracoes',{configuracao:{cargaHorariaSemanalMinutos:150,limiteFaltas:7}}),201,'criar regra').configuracoes[0];
    validar(await requisicao('PUT',`/api/v1/alertas-faltas/configuracoes/${regra.idConfiguracao}`,{configuracao:{cargaHorariaSemanalMinutos:150,limiteFaltas:8}}),200,'alterar regra');
    validar(await requisicao('DELETE',`/api/v1/alertas-faltas/configuracoes/${regra.idConfiguracao}`),204,'excluir regra');
    validar(await requisicao('GET','/api/v1/relatorios/alertas-faltas-bimestral?ano=2026&bimestre=4'),200,'calcular alertas');
  });
  await t.test('importação de PDF com texto selecionável', async () => {
    const texto = 'BT /F1 12 Tf 40 750 Td (TURMA DISCIPLINA) Tj ET';
    const objetos = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(texto)} >>\nstream\n${texto}\nendstream`
    ];
    let pdf = '%PDF-1.4\n';
    const posicoes = [0];
    objetos.forEach((objeto, indice) => {posicoes.push(Buffer.byteLength(pdf)); pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;});
    const inicioXref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${posicoes.length}\n0000000000 65535 f \n`;
    posicoes.slice(1).forEach(posicao => {pdf += `${String(posicao).padStart(10,'0')} 00000 n \n`;});
    pdf += `trailer\n<< /Size ${posicoes.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;
    const form = new FormData(); form.append('arquivo', new Blob([pdf], {type:'application/pdf'}), 'teste.pdf');
    const response = await fetch(base + '/api/v1/importacoes/pdf', {method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});
    const resultado = await response.json();
    assert.equal(response.status,200,JSON.stringify(resultado));
    assert.match(resultado.data.texto,/TURMA DISCIPLINA/);
  });
  await t.test('importações oficiais de grade e alunos', async () => {
    validar(await requisicao('POST','/api/v1/gradehorarios/importacao/substituir',{gradeHorarios:[shared.grade]}),200,'importar grade');
    validar(await requisicao('POST','/api/v1/alunos/importacao/substituir',{alunos:[shared.aluno]}),200,'importar alunos');
    assert.equal(validar(await requisicao('GET','/api/v1/alunos'),200,'listar importados').alunos.length,1);
  });
  await t.test('edição de aluno e virada anual preservam histórico', async () => {
    validar(await requisicao('PUT',`/api/v1/alunos/${shared.idAluno}`,{aluno:{...shared.aluno, alunoNome:'Aluno Atualizado'}}),200,'editar aluno');
    const resultado = validar(await requisicao('POST','/api/v1/alunos/transicao-anual',{turmaOrigem:shared.aluno.turma,turmaDestino:'EConAdm-3PMB',anoDestino:'2027',serieDestino:'3'}),200,'virada anual');
    assert.equal(resultado.total,1);
    const aluno = validar(await requisicao('GET','/api/v1/alunos/matricula/12345678'),200,'aluno após virada').alunos[0];
    assert.equal(aluno.turma,'EConAdm-3PMB'); assert.equal(aluno.historicoTurmas[0].turma,shared.aluno.turma);
  });
  await t.test('exclusão lógica de funcionário', async () => {
    validar(await requisicao('DELETE',`/api/v1/funcionarios/${shared.idFuncionario}`),204,'excluir funcionário');
    const funcionarios=validar(await requisicao('GET','/api/v1/funcionarios'),200,'funcionários ativos').funcionarios;
    assert.ok(!funcionarios.some(x => x.idFuncionario === shared.idFuncionario));
  });
  await t.test('exclusão lógica de aluno e aula', async () => {
    validar(await requisicao('DELETE',`/api/v1/gradehorarios/${shared.idGrade}`),204,'excluir aula');
    validar(await requisicao('DELETE',`/api/v1/alunos/${shared.idAluno}`),204,'excluir aluno');
    assert.equal(validar(await requisicao('GET','/api/v1/alunos'),200,'listar após exclusão').alunos.length,0);
  });
});
