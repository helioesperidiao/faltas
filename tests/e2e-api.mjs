// Roteiro ponta a ponta: sobe o servidor num banco descartável e percorre os fluxos pela API.
// Uso: npm run test:e2e  (ou: node tests/e2e-api.mjs <pasta-do-projeto>)
// Requer o MongoDB de MONGO_URI e as credenciais DEFAULT_ADMIN_* do .env. O banco
// "faltas_teste_claude" é APAGADO e recriado a cada execução; o banco real não é tocado.
// O servidor roda com TZ=America/Sao_Paulo para expor erros de fuso.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RAIZ = path.resolve(process.argv[2] || '.');
const require = createRequire(path.join(RAIZ, 'package.json'));
require('dotenv').config({ path: path.join(RAIZ, '.env') });
const { MongoClient } = require('mongodb');
const PORTA = 3099, BANCO = 'faltas_teste_claude', BASE = `http://localhost:${PORTA}`;
const resultados = [];
const arquivosCriados = []; // anexos enviados pelo teste, apagados ao final
const ok = (nome, cond, info = '') => { resultados.push({ nome, ok: !!cond, info }); };

async function req(metodo, uri, corpo, token, cru = false) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (corpo instanceof FormData) body = corpo;
  else if (cru) { headers['Content-Type'] = 'application/json'; body = corpo; }
  else if (corpo !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(corpo); }
  const r = await fetch(BASE + uri, { method: metodo, headers, body });
  const texto = await r.text();
  let json = null; try { json = JSON.parse(texto); } catch { }
  return { status: r.status, json, texto };
}

async function subirServidor() {
  const cli = new MongoClient(process.env.MONGO_URI); await cli.connect();
  await cli.db(BANCO).dropDatabase(); await cli.close();
  const env = { ...process.env, MONGO_DATABASE: BANCO, PORT: String(PORTA), NODE_ENV: 'development', TZ: 'America/Sao_Paulo' };
  const filho = spawn(process.execPath, ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', 'src/index.ts'], { cwd: RAIZ, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  filho.stdout.on('data', d => log += d); filho.stderr.on('data', d => log += d);
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 500));
    try { if ((await fetch(BASE + '/Login.html')).ok) return { filho, log: () => log }; } catch { }
  }
  console.log(log.slice(-3000)); throw new Error('servidor não subiu');
}

const dataISO = (d) => d.toISOString().slice(0, 10);
// Segunda-feira, 09/03/2026 (1º bimestre), e as seguintes.
const SEG = ['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23'];

async function main() {
  // P-001: não há segredo de reserva no código; sem JWT_SECRET o servidor recusa subir.
  {
    const semSegredo = spawn(process.execPath, ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', 'src/index.ts'],
      { cwd: RAIZ, env: { ...process.env, JWT_SECRET: '', MONGO_DATABASE: BANCO, PORT: String(PORTA + 1) }, stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = '';
    semSegredo.stdout.on('data', d => saida += d); semSegredo.stderr.on('data', d => saida += d);
    const codigo = await Promise.race([
      new Promise(resolve => semSegredo.on('exit', resolve)),
      new Promise(resolve => setTimeout(() => { semSegredo.kill(); resolve('ainda rodando'); }, 30000))
    ]);
    ok('servidor não sobe sem JWT_SECRET', codigo === 1 && saida.includes('JWT_SECRET'), `saída=${codigo}`);
  }
  const srv = await subirServidor();
  try {
    // ---------- estáticos ----------
    for (const u of ['/Login.html', '/telaChamada.html', '/vendor/xlsx/xlsx.full.min.js', '/vendor/codepage/cpexcel.full.js', '/js/TurmasChamada.mjs'])
      ok(`GET ${u}`, (await fetch(BASE + u)).status === 200);

    // ---------- autenticação ----------
    const email = process.env.DEFAULT_ADMIN_EMAIL, senha = process.env.DEFAULT_ADMIN_PASSWORD;
    let r = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email, senha } });
    ok('login admin', r.status === 200 && r.json?.data?.token, r.status);
    const TK = r.json?.data?.token;
    r = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email, senha: senha + 'x' } });
    ok('login senha errada → 401', r.status === 401, r.status);
    r = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email: 'admin', senha: 'x' } });
    ok('login e-mail sem formato → 4xx', r.status >= 400 && r.status < 500, r.status);
    r = await req('GET', '/api/v1/alunos');
    ok('sem token → 401', r.status === 401, r.status);
    r = await req('POST', '/api/v1/funcionarios/login', '{"funcionario": ', null, true);
    ok('JSON malformado → 400', r.status === 400, r.status);
    r = await req('GET', '/api/v1/alunos/xyz', undefined, TK);
    ok('id inválido → 4xx', r.status >= 400 && r.status < 500, r.status);
    r = await req('POST', '/api/v1/alunos', '{"x":"' + 'a'.repeat(11 * 1024 * 1024) + '"}', TK, true);
    ok('payload > 10mb → 413 sem caractere corrompido', r.status === 413 && !r.texto.includes('�'), r.status);

    // ---------- cargos ----------
    r = await req('GET', '/api/v1/cargos', undefined, TK);
    const cargos = r.json?.data?.cargos || [];
    const idInspetor = cargos.find(c => c.nomeCargo === 'Inspetor')?.idCargo;
    const idPP = cargos.find(c => c.nomeCargo === 'Processo Pedagógico')?.idCargo;
    ok('cargos aceitos existem', idInspetor && idPP, cargos.map(c => c.nomeCargo).join(','));
    r = await req('PUT', `/api/v1/cargos/${idInspetor}`, { cargo: { nomeCargo: 'Inspetor' } }, TK);
    r = await req('PUT', `/api/v1/cargos/${idInspetor}`, { cargo: { nomeCargo: 'Diretor' } }, TK);
    ok('cargo não pode ser renomeado para fora da lista', r.status === 400, r.status);
    r = await req('POST', '/api/v1/cargos', { cargo: { nomeCargo: 'Coordenador' } }, TK);
    ok('cargo fora da lista não pode ser criado', r.status === 400, r.status);
    r = await req('PUT', `/api/v1/cargos/${idInspetor}`, { cargo: { nomeCargo: 'Inspetor' } }, TK);
    ok('Processo Pedagógico altera cargo', r.status === 200, r.status + ' ' + r.json?.message);

    // ---------- importação de alunos (mesmo caminho da tela) ----------
    const imp = await import(pathToFileURL(path.join(RAIZ, 'src/public/js/ImportadorCsv.js')).href);
    const csv = readFileSync(path.join(RAIZ, 'tabela_alunos_ficticia.csv'), 'utf8');
    const CAMPOS = ['ano', 'curso', 'turma', 'serie', 'situacao', 'matricula', 'alunoNome', 'dataNascimento', 'alunoRG', 'alunoFone', 'alunoEmail', 'alunoFoneCel', 'paiNome', 'paiFoneCel', 'paiFoneFixo', 'paiFoneRecado', 'paiEmail', 'maeNome', 'maeFoneCel', 'maeFoneFixo', 'maeFoneRecado', 'maeEmail', 'finanNome', 'finanFone', 'legalNome', 'legalFone'];
    const prep = imp.prepararImportacao(csv, imp.ESQUEMAS_IMPORTACAO.alunos, CAMPOS);
    ok('CSV fictício: cabeçalhos reconhecidos', prep.ausentes.length === 0, prep.ausentes.join(','));
    const m = prep.mapeamento, cab = prep.cabecalhos;
    ok('CSV: matrícula ← ALUNO e nome ← NOME_COMPL', /^aluno$/i.test(cab[m.matricula]) && /nome.compl/i.test(cab[m.alunoNome]), `${cab[m.matricula]} / ${cab[m.alunoNome]}`);
    ok('CSV: telefone fixo do pai ← PAI_FONE', /^pai.fone$/i.test(cab[m.paiFoneFixo] || ''), cab[m.paiFoneFixo]);
    const alunos = prep.linhas.map(l => Object.fromEntries(CAMPOS.map(c => [c, l[c] ?? ''])));
    r = await req('POST', '/api/v1/alunos/importacao/substituir', { alunos }, TK);
    ok('importa alunos', r.status === 200 && r.json?.data?.criados === alunos.length, `${r.status} ${JSON.stringify(r.json?.data ?? r.json?.message)}`);
    r = await req('POST', '/api/v1/alunos/importacao/substituir', { alunos }, TK);
    ok('reimportação atualiza sem duplicar', r.json?.data?.criados === 0 && r.json?.data?.atualizados === alunos.length, JSON.stringify(r.json?.data));
    const semUltimo = alunos.slice(0, -1);
    r = await req('POST', '/api/v1/alunos/importacao/substituir', { alunos: semUltimo }, TK);
    ok('substituição arquiva ausente', r.json?.data?.arquivados === 1, JSON.stringify(r.json?.data));
    r = await req('POST', '/api/v1/alunos/importacao/substituir', { alunos }, TK);
    const mUlt = alunos.at(-1).matricula;
    const ativos = (await req('GET', '/api/v1/alunos', undefined, TK)).json?.data?.alunos || [];
    const arquivados = (await req('GET', '/api/v1/alunos/deleted', undefined, TK)).json?.data?.alunos || [];
    const copias = ativos.filter(a => a.matricula === mUlt).length + arquivados.filter(a => a.matricula === mUlt).length;
    ok('reimportar arquivado reativa sem duplicar matrícula', copias === 1 && ativos.length === alunos.length, `cópias=${copias} ativos=${ativos.length}`);

    {
      const cliIni = new MongoClient(process.env.MONGO_URI); await cliIni.connect();
      await cliIni.db(BANCO).collection('aluno').updateMany({}, { $set: { turmaInicioEm: new Date('2026-01-01T00:00:00Z') } });
      await cliIni.close();
    }
    const porTurma = {}; for (const a of ativos) (porTurma[a.turma] ||= []).push(a);
    const TURMA = Object.entries(porTurma).sort((x, y) => y[1].length - x[1].length)[0][0];
    const aluno = porTurma[TURMA][0];
    const colegas = ativos.filter(a => a.turma === TURMA);

    // ---------- turmas da chamada (mesma função da tela) ----------
    {
      const { turmasDosAlunos } = await import(pathToFileURL(path.join(RAIZ, 'src/public/js/TurmasChamada.mjs')).href);
      const turmasPlanilha = [...new Set(alunos.map(a => a.turma.trim()).filter(Boolean))].sort();
      const opcoes = turmasDosAlunos(ativos);
      ok('chamada: o seletor tem cada turma da planilha uma única vez', JSON.stringify([...opcoes].sort()) === JSON.stringify(turmasPlanilha) && new Set(opcoes).size === opcoes.length, `${opcoes.length} opções / ${turmasPlanilha.length} turmas`);
      const divergentes = [];
      for (const turma of opcoes) {
        const daTurma = (await req('GET', `/api/v1/alunos/turma/${encodeURIComponent(turma)}`, undefined, TK)).json?.data?.alunos || [];
        const esperadas = alunos.filter(a => a.turma.trim() === turma).map(a => a.matricula).sort();
        if (JSON.stringify(daTurma.map(a => a.matricula).sort()) !== JSON.stringify(esperadas)) divergentes.push(`${turma}: ${daTurma.length}/${esperadas.length}`);
      }
      ok('chamada: cada turma abre exatamente os alunos dela na planilha', divergentes.length === 0, divergentes.join('; '));
    }

    // ---------- grade (importação + substituição) ----------
    const grade = [];
    for (const dia of ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira']) {
      grade.push({ turma: TURMA, horaInicio: '07:00', horaFim: '07:50', dia, cod: dia === 'segunda-feira' ? 'MAT' : 'POR', disciplina: dia === 'segunda-feira' ? 'Matemática' : 'Português' });
      grade.push({ turma: TURMA, horaInicio: '07:50', horaFim: '08:40', dia, cod: 'HIS', disciplina: 'História' });
    }
    // normalização da linha como a tela faz
    const gLinha = imp.normalizarLinhaGradeHorario({ turma: TURMA, horaInicio: '07h30-08h20', horaFim: '07h30-08h20', dia: 'segunda-feira', cod: 'X', disciplina: 'Y' });
    ok('grade: intervalo 07h30-08h20 é separado', gLinha.horaInicio === '07:30' && gLinha.horaFim === '08:20', `${gLinha.horaInicio} / ${gLinha.horaFim}`);
    r = await req('POST', '/api/v1/gradehorarios/importacao/substituir', { gradeHorarios: grade }, TK);
    ok('importa grade', r.status === 200, `${r.status} ${JSON.stringify(r.json?.data ?? r.json?.message)}`);
    r = await req('POST', '/api/v1/gradehorarios/importacao/substituir', { gradeHorarios: grade }, TK);
    ok('reimportação da grade não duplica', r.json?.data?.criadas === 0, JSON.stringify(r.json?.data));
    r = await req('POST', '/api/v1/gradehorarios/importacao/substituir', { gradeHorarios: [...grade, { turma: TURMA, horaInicio: '08:40', horaFim: '09:30', dia: 'sexta-feira', cod: 'ART', disciplina: 'Artes' }] }, TK);
    r = await req('POST', '/api/v1/gradehorarios/importacao/substituir', { gradeHorarios: grade }, TK);
    ok('substituição da grade arquiva aula ausente', r.json?.data?.arquivadas === 1, JSON.stringify(r.json?.data));

    // ---------- chamada (rotas exatamente como a tela chama) ----------
    const tela = readFileSync(path.join(RAIZ, 'src/public/telaChamada.html'), 'utf8');
    const rotasTela = [...tela.matchAll(/api\.(get|post|put)\(\s*[`'"]([^`'"?$]+)/g)].map(x => x[2].replace(/\/$/, ''));
    for (const rota of new Set(rotasTela)) {
      const resp = await req('GET', '/' + rota.replace(/^\//, ''), undefined, TK);
      ok(`tela da chamada usa rota existente: ${rota}`, resp.status !== 404, resp.status);
    }
    // Telas que passam um recurso com barra final ao PUT/DELETE geram `recurso//id` (404 em HTML).
    const paginas = ['Abonos', 'AlertasFaltas', 'Alunos', 'Cargos', 'Funcionarios', 'GradeHorarios', 'telaChamada'];
    const comBarraDupla = paginas.flatMap(pagina => [...readFileSync(path.join(RAIZ, `src/public/${pagina}.html`), 'utf8')
      .matchAll(/api\.(put|delete|getById)\(\s*["'`]([^"'`]+\/)["'`]/g)].map(m => `${pagina}: api.${m[1]}("${m[2]}")`));
    ok('telas não montam URL com barra dupla no PUT/DELETE', comBarraDupla.length === 0, comBarraDupla.join('; '));
    const registrarFalta = async (matricula, dia, falta = true) => req('POST', '/api/v1/registros', { registro: { ano: 2026, codDisciplina: 'GERAL', horaInicio: 0, horaFim: 0, matricula, falta, dia, atrasado: 'Não' } }, TK);
    const ids = {};
    for (const dia of SEG) {
      for (const c of colegas) {
        const resp = await registrarFalta(c.matricula, dia, c.matricula === aluno.matricula || (c === colegas[2] && dia === SEG[1]));
        if (c.matricula === aluno.matricula) ids[dia] = resp.json?.data?.registros?.[0]?.idRegistro;
      }
    }
    ok('chamada grava faltas e presenças', Object.values(ids).every(Boolean), JSON.stringify(ids));
    r = await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${SEG[0]}`, undefined, TK);
    ok('chamada salva é restaurada', (r.json?.data?.registros || []).length === colegas.length, `${r.status} ${(r.json?.data?.registros || []).length}/${colegas.length}`);
    r = await registrarFalta(aluno.matricula, SEG[0]);
    const r2 = await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${SEG[0]}`, undefined, TK);
    ok('não cria segundo registro geral do mesmo aluno e dia', (r2.json?.data?.registros || []).filter(x => x.matricula === aluno.matricula).length === 1, `${r.status} ${(r2.json?.data?.registros || []).filter(x => x.matricula === aluno.matricula).length}`);

    // ---------- alertas ----------
    r = await req('GET', '/api/v1/alertas-faltas/configuracoes', undefined, TK);
    ok('configurações de alerta padrão', (r.json?.data?.configuracoes || []).length >= 2, JSON.stringify(r.json?.data));
    r = await req('POST', '/api/v1/alertas-faltas/configuracoes', { configuracao: { cargaHorariaSemanalMinutos: 150, limiteFaltas: 7 } }, TK);
    const idCfg = r.json?.data?.configuracao?.idConfiguracao || r.json?.data?.configuracoes?.[0]?.idConfiguracao;
    ok('cria regra de alerta', r.status === 201 || r.status === 200, r.status + ' ' + r.json?.message);
    if (idCfg) {
      r = await req('PUT', `/api/v1/alertas-faltas/configuracoes/${idCfg}`, { configuracao: { cargaHorariaSemanalMinutos: 150, limiteFaltas: 8 } }, TK);
      ok('altera regra de alerta', r.status === 200, r.status);
      r = await req('DELETE', `/api/v1/alertas-faltas/configuracoes/${idCfg}`, undefined, TK);
      ok('exclui regra de alerta', r.status === 200 || r.status === 204, r.status);
    }
    r = await req('GET', '/api/v1/relatorios/alertas-faltas-bimestral?ano=2026&bimestre=1', undefined, TK);
    const alertas = r.json?.data?.alertas || [];
    const alMat = alertas.find(a => a.matricula === aluno.matricula && a.codDisciplina === 'MAT');
    ok('alerta de muitas faltas (MAT, 50min/sem, 4 faltas ≥ 3)', alMat && alMat.totalFaltas === 4, `${r.status} ${JSON.stringify(alertas.map(a => [a.codDisciplina, a.totalFaltas]))}`);
    ok('sem alerta para quem não faltou', !alertas.some(a => a.matricula !== aluno.matricula), alertas.length);
    ok('1º bimestre vai de 01/01 a 31/03 (UTC)', r.json?.data?.dataInicio?.startsWith('2026-01-01T00:00:00') && r.json?.data?.dataFim?.startsWith('2026-03-31T23:59:59'), `${r.json?.data?.dataInicio} ${r.json?.data?.dataFim}`);
    // P-012: consultar de novo sem mudança nos dados não regrava os alertas guardados.
    const alertasGuardados = async () => {
      const c = new MongoClient(process.env.MONGO_URI); await c.connect();
      const docs = await c.db(BANCO).collection('alertasFaltas').find({ ano: 2026, bimestre: 1 }).toArray();
      await c.close();
      return docs;
    };
    const antesDaSegunda = await alertasGuardados();
    await new Promise(resolve => setTimeout(resolve, 25)); // garante carimbo de tempo diferente se houver regravação
    await req('GET', '/api/v1/relatorios/alertas-faltas-bimestral?ano=2026&bimestre=1', undefined, TK);
    const depoisDaSegunda = await alertasGuardados();
    const carimbos = docs => JSON.stringify(docs.map(d => [String(d._id), d.ativo, new Date(d.atualizadoEm).getTime()]).sort());
    ok('alerta igual ao guardado não é regravado', antesDaSegunda.length > 0 && carimbos(antesDaSegunda) === carimbos(depoisDaSegunda), `${antesDaSegunda.length} alertas`);
    // falta no primeiro dia do bimestre (01/04 é 2º bimestre; 31/03 é o fim do 1º)
    r = await registrarFalta(colegas[1].matricula, '2026-04-01');
    // 01/04 já foi gravado como presença? registrar outro aluno que não tem registro nesse dia
    const b1 = await req('GET', '/api/v1/relatorios/alertas-faltas-bimestral?ano=2026&bimestre=1', undefined, TK);
    ok('falta de 01/04 não entra no 1º bimestre', !(b1.json?.data?.alertas || []).some(a => a.matricula === colegas[1].matricula), JSON.stringify(b1.json?.data?.dataFim));

    // ---------- abono ----------
    r = await req('POST', '/api/v1/abonos/', { abono: { matricula: aluno.matricula, dataInicio: SEG[0], dataFim: SEG[0], motivo: 'Atestado médico' } }, TK);
    const idAbono = r.json?.data?.abonos?.[0]?.idAbono || r.json?.data?.abono?.idAbono;
    ok('cria abono', r.status === 201 && idAbono, r.status + ' ' + JSON.stringify(r.json?.data ?? r.json?.message).slice(0, 200));
    const fd = new FormData(); fd.append('arquivo', new Blob([Buffer.from([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }), 'atestado.jpg');
    r = await req('POST', `/api/v1/abonos/${idAbono}/arquivo`, fd, TK);
    ok('anexa atestado jpg', r.status === 200 || r.status === 201, r.status + ' ' + r.json?.message);
    arquivosCriados.push(path.join(RAIZ, 'uploads', 'abono', `${idAbono}.jpg`));
    const fd2 = new FormData(); fd2.append('arquivo', new Blob(['MZ'], { type: 'application/octet-stream' }), 'virus.exe');
    r = await req('POST', `/api/v1/abonos/${idAbono}/arquivo`, fd2, TK);
    ok('anexo .exe recusado com 4xx', r.status >= 400 && r.status < 500, r.status);
    const fd3 = new FormData(); fd3.append('arquivo', new Blob([Buffer.from([0xff, 0xd8])], { type: 'image/jpeg' }), 'a.jpg');
    const arquivoFora = path.join(RAIZ, 'fora.jpg');
    const existiaAntes = existsSync(arquivoFora);
    r = await req('POST', `/api/v1/abonos/..%5C..%5Cfora/arquivo`, fd3, TK);
    ok('id de abono inválido no upload → 4xx', r.status >= 400 && r.status < 500, r.status);
    const gravouFora = !existiaAntes && existsSync(arquivoFora);
    if (gravouFora) arquivosCriados.push(arquivoFora);
    ok('upload não grava arquivo fora de uploads/', !gravouFora, arquivoFora);
    r = await req('PUT', `/api/v1/abonos/${idAbono}/aprovar`, {}, TK);
    ok('aprova abono', r.status === 200, r.status + ' ' + r.json?.message);
    r = await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${SEG[0]}`, undefined, TK);
    const regAbonado = (r.json?.data?.registros || []).find(x => x.matricula === aluno.matricula);
    ok('falta abonada após aprovação', regAbonado?.situacao === 'Abonada', regAbonado?.situacao);
    // correção da chamada pela tela (PUT do mesmo registro)
    r = await req('PUT', `/api/v1/registros/${regAbonado?.idRegistro}`, { registro: { ano: 2026, codDisciplina: 'GERAL', horaInicio: 0, horaFim: 0, matricula: aluno.matricula, falta: true, dia: SEG[0], atrasado: 'Não' } }, TK);
    const r3 = await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${SEG[0]}`, undefined, TK);
    ok('corrigir chamada preserva Abonada', (r3.json?.data?.registros || []).find(x => x.matricula === aluno.matricula)?.situacao === 'Abonada', `${r.status} ${(r3.json?.data?.registros || []).find(x => x.matricula === aluno.matricula)?.situacao}`);
    r = await req('GET', '/api/v1/relatorios/alertas-faltas-bimestral?ano=2026&bimestre=1', undefined, TK);
    const alertaMatGuardado = (await alertasGuardados()).find(d => d.matricula === aluno.matricula && d.codDisciplina === 'MAT' && d.ativo);
    ok('alerta que mudou é regravado (total 4 → 3)', alertaMatGuardado?.totalFaltas === 3, alertaMatGuardado?.totalFaltas);
    ok('alerta desconta falta abonada', (r.json?.data?.alertas || []).find(a => a.matricula === aluno.matricula && a.codDisciplina === 'MAT')?.totalFaltas === 3, JSON.stringify((r.json?.data?.alertas || []).map(a => [a.codDisciplina, a.totalFaltas])));
    r = await req('PUT', `/api/v1/abonos/${idAbono}`, { abono: { matricula: aluno.matricula, dataInicio: SEG[0], dataFim: SEG[0], motivo: 'Atestado médico corrigido' } }, TK);
    const ab = (await req('GET', `/api/v1/abonos/${idAbono}`, undefined, TK)).json?.data;
    const abObj = Array.isArray(ab?.abonos) ? ab.abonos[0] : ab?.abonos;
    ok('corrigir abono aprovado mantém o atestado e volta para análise', abObj?.status === 'Pendente' && abObj?.nomeArquivo, `${r.status} ${abObj?.status} ${abObj?.nomeArquivo}`);
    const r4 = await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${SEG[0]}`, undefined, TK);
    ok('abono de volta à análise devolve a falta para Normal', (r4.json?.data?.registros || []).find(x => x.matricula === aluno.matricula)?.situacao === 'Normal', (r4.json?.data?.registros || []).find(x => x.matricula === aluno.matricula)?.situacao);
    r = await req('PUT', `/api/v1/abonos/${idAbono}/aprovar`, {}, TK);
    ok('reaprova abono corrigido', r.status === 200, r.status);
    // P-009: abono aprovado antes de a falta existir; dois abonos aprovados sobrepostos.
    const TER = '2026-03-03', QUA = '2026-03-04';
    const abonoLongo = (await req('POST', '/api/v1/abonos/', { abono: { matricula: aluno.matricula, dataInicio: TER, dataFim: QUA, motivo: 'Atestado de 2 dias' } }, TK)).json?.data?.abonos?.[0]?.idAbono;
    const abonoCurto = (await req('POST', '/api/v1/abonos/', { abono: { matricula: aluno.matricula, dataInicio: TER, dataFim: TER, motivo: 'Consulta' } }, TK)).json?.data?.abonos?.[0]?.idAbono;
    await req('PUT', `/api/v1/abonos/${abonoLongo}/aprovar`, {}, TK);
    await req('PUT', `/api/v1/abonos/${abonoCurto}/aprovar`, {}, TK);
    await registrarFalta(aluno.matricula, TER);
    const situacaoEm = async dia => (await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${dia}`, undefined, TK)).json?.data?.registros?.find(x => x.matricula === aluno.matricula)?.situacao;
    ok('falta lançada depois da aprovação já nasce Abonada', await situacaoEm(TER) === 'Abonada', await situacaoEm(TER));
    r = await req('DELETE', `/api/v1/abonos/${abonoCurto}`, undefined, TK);
    {
      const QUI = '2026-03-05';
      const idQui = (await req('POST', '/api/v1/abonos/', { abono: { matricula: aluno.matricula, dataInicio: QUI, dataFim: QUI, motivo: 'Atestado' } }, TK)).json?.data?.abonos?.[0]?.idAbono;
      await req('PUT', `/api/v1/abonos/${idQui}/aprovar`, {}, TK);
      await registrarFalta(aluno.matricula, QUI);
      const anexo = new FormData(); anexo.append('arquivo', new Blob([Buffer.from([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }), 'atestado.jpg');
      r = await req('POST', `/api/v1/abonos/${idQui}/arquivo`, anexo, TK);
      arquivosCriados.push(path.join(RAIZ, 'uploads', 'abono', `${idQui}.jpg`));
      const abQui = (await req('GET', `/api/v1/abonos/${idQui}`, undefined, TK)).json?.data?.abonos;
      ok('anexar atestado a abono aprovado mantém a falta Abonada', r.status < 300 && await situacaoEm(QUI) === 'Abonada' && (Array.isArray(abQui) ? abQui[0] : abQui)?.status === 'Aprovado', `${r.status} ${await situacaoEm(QUI)}`);
      const idRegQui = (await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${QUI}`, undefined, TK)).json?.data?.registros?.find(x => x.matricula === aluno.matricula)?.idRegistro;
      await req('PUT', `/api/v1/registros/${idRegQui}`, { registro: { ano: 2026, codDisciplina: 'GERAL', horaInicio: 0, horaFim: 0, matricula: aluno.matricula, falta: false, dia: QUI, atrasado: 'Não' } }, TK);
      await req('DELETE', `/api/v1/abonos/${idQui}`, undefined, TK);
      const aposExclusao = (await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${QUI}`, undefined, TK)).json?.data?.registros?.find(x => x.matricula === aluno.matricula);
      ok('excluir o abono devolve a situação para Normal e preserva a falta', aposExclusao?.situacao === 'Normal' && aposExclusao?.falta === true, `${aposExclusao?.situacao} falta=${aposExclusao?.falta}`);
    }
    ok('excluir um abono não desfaz o dia coberto por outro abono aprovado', await situacaoEm(TER) === 'Abonada', `${r.status} ${await situacaoEm(TER)}`);
    r = await req('POST', '/api/v1/abonos/', { abono: { matricula: aluno.matricula, dataInicio: SEG[2], dataFim: SEG[0], motivo: 'x' } }, TK);
    ok('abono com fim antes do início → 400', r.status === 400, r.status);

    // ---------- dispensa ----------
    r = await req('POST', '/api/v1/dispensas', { dispensa: { idAluno: aluno.idAluno, cod: 'HIS', disciplina: 'História', turma: TURMA, dia: SEG[0], dataFim: SEG[3], horaInicio: 7, horaFim: 8, motivo: 'Educação física' } }, TK);
    const idDisp = r.json?.data?.dispensas?.[0]?.idDispensa || r.json?.data?.dispensa?.idDispensa;
    ok('cria dispensa', (r.status === 201 || r.status === 200) && idDisp, r.status + ' ' + r.json?.message);
    r = await req('PUT', `/api/v1/dispensas/${idDisp}`, { dispensa: { idAluno: aluno.idAluno, cod: 'HIS', disciplina: 'História', turma: TURMA, dia: SEG[0], dataFim: SEG[3], horaInicio: 7, horaFim: 8, motivo: 'Educação física (ajuste)' } }, TK);
    ok('altera dispensa', r.status === 200, r.status + ' ' + r.json?.message + ' ' + JSON.stringify(r.json?.error));

    // ---------- movimentações e fechamento ----------
    r = await req('POST', '/api/v1/movimentacoes/lote', { movimentacoes: [{ matricula: colegas[2].matricula, nomeAluno: colegas[2].alunoNome, tipo: 'entrada', horario: '07:50', data: SEG[1] }] }, TK);
    ok('lote de entradas/saídas', r.status === 201 || r.status === 200, r.status + ' ' + r.json?.message);
    r = await req('GET', `/api/v1/movimentacoes?data=${SEG[1]}`, undefined, TK);
    ok('lista movimentações do dia', (r.json?.data?.movimentacoes || []).length === 1, r.status + ' ' + (r.json?.data?.movimentacoes || []).length);
    r = await req('GET', `/api/v1/relatorios/fechamento-dia?data=${SEG[1]}`, undefined, TK);
    const fech = r.json?.data || {};
    ok('fechamento do dia', r.status === 200 && Array.isArray(fech.aulasGeral), r.status + ' ' + Object.keys(fech).join(','));
    ok('fechamento: atraso das 07:50 perde só a aula das 07:00', (fech.aulasAtrasados || []).filter(a => String(a.matricula ?? a.Matricula) === colegas[2].matricula).length === 1, JSON.stringify(fech.aulasAtrasados));
    const aulasDoAluno = (fech.aulasGeral || []).filter(a => a.matricula === aluno.matricula).map(a => a.codDisciplina);
    ok('fechamento: aula dispensada (HIS) fica fora do CSV de faltas', aulasDoAluno.includes('MAT') && !aulasDoAluno.includes('HIS'), JSON.stringify(aulasDoAluno));

    // ---------- relatórios ----------
    r = await req('GET', `/api/v1/relatorios/frequencia?turma=${encodeURIComponent(TURMA)}&dia=${SEG[1]}`, undefined, TK);
    const freq = r.json?.data?.frequencia || r.json?.data?.alunos || r.json?.data || [];
    ok('frequência por turma', r.status === 200, r.status);
    {
      const c = new MongoClient(process.env.MONGO_URI); await c.connect();
      const base = await c.db(BANCO).collection('aluno').findOne({ matricula: aluno.matricula });
      const { _id, ...copia } = base;
      await c.db(BANCO).collection('aluno').insertOne({ ...copia, matricula: '99999999', alunoNome: 'Aluno Acento', turma: 'AdministraÃ§Ã£o-1A', historicoTurmas: [] });
      await c.close();
      const rf = await req('GET', `/api/v1/relatorios/frequencia?turma=${encodeURIComponent('Administração-1A')}&dia=${SEG[1]}`, undefined, TK);
      ok('turma gravada com acento corrompido aparece na frequência', (rf.json?.data?.frequencia || []).some(a => a.matricula === '99999999'), JSON.stringify(rf.json?.data?.frequencia));
      const rt = await req('GET', `/api/v1/alunos/turma/${encodeURIComponent('Administração-1A')}`, undefined, TK);
      ok('turma gravada com acento corrompido abre os alunos na chamada', (rt.json?.data?.alunos || []).some(a => a.matricula === '99999999' && a.turma === 'Administração-1A'), JSON.stringify(rt.json?.data?.alunos));
    }
    ok('frequência mostra atrasado', JSON.stringify(freq).includes('Atrasado'), JSON.stringify(freq).slice(0, 200));
    r = await req('GET', `/api/v1/relatorios/faltas/mes?turma=${encodeURIComponent(TURMA)}&ano=2026&mes=3`, undefined, TK);
    ok('faltas no mês', r.status === 200, r.status);
    const fm = JSON.stringify(r.json?.data);
    r = await req('GET', `/api/v1/relatorios/faltas/semana?turma=${encodeURIComponent(TURMA)}&data=${SEG[0]}`, undefined, TK);
    ok('faltas na semana', r.status === 200, r.status);
    r = await req('GET', `/api/v1/relatorios/faltas/periodo?turma=${encodeURIComponent(TURMA)}&dataInicio=2026-03-01&dataFim=2026-03-31`, undefined, TK);
    ok('faltas no período', r.status === 200, r.status);
    const total = (r.json?.data?.faltas || r.json?.data?.alunos || []).find?.(a => a.matricula === aluno.matricula)?.totalFaltas;
    ok('faltas no período descontam a abonada e incluem falta preservada após exclusão do abono', total === 4, `total=${total} ${fm.slice(0, 120)}`);
    r = await req('GET', `/api/v1/relatorios/frequencia?turma=${encodeURIComponent(TURMA)}`, undefined, TK);
    ok('relatório sem data → 400', r.status === 400, r.status);
    r = await req('GET', `/api/v1/relatorios/faltas/mes?turma=${encodeURIComponent(TURMA)}&ano=x&mes=3`, undefined, TK);
    ok('mês inválido → 400', r.status === 400, r.status);

    // ---------- virada anual ----------
    r = await req('POST', '/api/v1/alunos/transicao-anual', { turmaOrigem: TURMA, turmaDestino: TURMA + '-NOVA', serieDestino: '2', anoDestino: '2027' }, TK);
    ok('virada anual de turma', r.status === 200, r.status + ' ' + r.json?.message);
    r = await req('GET', `/api/v1/registros/chamada?turma=${encodeURIComponent(TURMA)}&dia=${SEG[0]}`, undefined, TK);
    ok('registros antigos mantêm a turma anterior', (r.json?.data?.registros || []).length === colegas.length, (r.json?.data?.registros || []).length);
    // P-003: depois da virada, a entrada na turma nova é hoje; não há chamada antes disso.
    r = await registrarFalta(colegas[1].matricula, '2026-03-20');
    ok('chamada antes da entrada do aluno na turma → 400', r.status === 400, `${r.status} ${r.json?.message}`);

    // ---------- funcionários e permissões ----------
    r = await req('POST', '/api/v1/funcionarios', { funcionario: { nomeFuncionario: 'Inspetor Teste', email: 'inspetor.teste@exemplo.com', senha: '1234', recebeValeTransporte: 0, cargo: { idCargo: idInspetor } } }, TK);
    const idInsp = r.json?.data?.funcionarios?.[0]?.idFuncionario || r.json?.data?.funcionario?.idFuncionario;
    ok('cria inspetor (senha só números)', r.status === 201 && idInsp, r.status + ' ' + r.json?.message);
    r = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email: 'inspetor.teste@exemplo.com', senha: '1234' } });
    const TKI = r.json?.data?.token;
    ok('login inspetor', r.status === 200 && TKI, r.status);
    r = await req('POST', '/api/v1/funcionarios', { funcionario: { nomeFuncionario: 'Intruso', email: 'intruso@exemplo.com', senha: '1', recebeValeTransporte: 0, cargo: { idCargo: idPP } } }, TKI);
    ok('inspetor não cria Processo Pedagógico', r.status === 403, r.status);
    r = await req('GET', '/api/v1/relatorios/alertas-faltas-bimestral?ano=2026&bimestre=1', undefined, TKI);
    ok('inspetor não vê alertas', r.status === 403, r.status);
    r = await req('PUT', `/api/v1/funcionarios/${idInsp}`, { funcionario: { nomeFuncionario: 'Inspetor Teste', email: 'inspetor.teste@exemplo.com', senha: 'nova5678', recebeValeTransporte: 0, cargo: { idCargo: idInspetor } } }, TK);
    ok('altera senha do inspetor', r.status === 200, r.status + ' ' + r.json?.message);
    r = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email: 'inspetor.teste@exemplo.com', senha: 'nova5678' } });
    ok('login com a senha nova', r.status === 200, r.status);
    const cli = new MongoClient(process.env.MONGO_URI); await cli.connect();
    const docInsp = await cli.db(BANCO).collection('funcionario').findOne({ email: 'inspetor.teste@exemplo.com' });
    ok('senha nova guardada com hash', String(docInsp?.senha || '').startsWith('$2'), String(docInsp?.senha || '').slice(0, 4));
    r = await req('DELETE', `/api/v1/funcionarios/${idInsp}`, undefined, TK);
    ok('exclui inspetor', r.status === 200 || r.status === 204, r.status);
    r = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email: 'inspetor.teste@exemplo.com', senha: 'nova5678' } });
    ok('excluído não faz login', r.status === 401, r.status);
    r = await req('GET', '/api/v1/alunos', undefined, TKI);
    ok('token de funcionário excluído perde o acesso na hora', r.status === 401, r.status);
    r = await req('POST', '/api/v1/funcionarios', { funcionario: { nomeFuncionario: 'Inspetor Novo', email: 'inspetor.teste@exemplo.com', senha: 'outra9012', recebeValeTransporte: 0, cargo: { idCargo: idInspetor } } }, TK);
    const loginNovo = await req('POST', '/api/v1/funcionarios/login', { funcionario: { email: 'inspetor.teste@exemplo.com', senha: 'outra9012' } });
    ok('e-mail de funcionário excluído pode ser recadastrado e entrar', r.status === 201 && loginNovo.status === 200, `${r.status} ${loginNovo.status}`);
    // P-010: cadastro manual de matrícula arquivada reativa o cadastro antigo.
    const alvo = (await req('GET', '/api/v1/alunos', undefined, TK)).json?.data?.alunos?.find(a => a.turma !== TURMA + '-NOVA');
    await req('DELETE', `/api/v1/alunos/${alvo.idAluno}`, undefined, TK);
    r = await req('POST', '/api/v1/alunos', { aluno: { matricula: alvo.matricula, alunoNome: alvo.alunoNome, turma: alvo.turma, curso: alvo.curso, serie: alvo.serie, ano: alvo.ano } }, TK);
    const reativado = r.json?.data?.alunos?.[0] || r.json?.data?.aluno;
    const arquivadosDepois = ((await req('GET', '/api/v1/alunos/deleted', undefined, TK)).json?.data?.alunos || []).filter(a => a.matricula === alvo.matricula).length;
    ok('cadastro manual de matrícula arquivada reativa o mesmo aluno', reativado?.idAluno === alvo.idAluno && arquivadosDepois === 0, `${r.status} ${reativado?.idAluno} vs ${alvo.idAluno}, arquivados=${arquivadosDepois}`);
    const dupAlertas = await cli.db(BANCO).collection('alertasFaltas').aggregate([{ $group: { _id: { m: '$matricula', c: '$codDisciplina', a: '$ano', b: '$bimestre' }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray();
    ok('alertas gravados sem duplicata', dupAlertas.length === 0, dupAlertas.length);
    await cli.close();

    const erros500 = (srv.log().match(/erro n.o tratado/g) || []).length;
    ok('nenhum erro 500 não tratado no log do servidor', erros500 === 0, erros500);
  } catch (e) {
    ok('roteiro executou até o fim', false, e.stack.split('\n').slice(0, 2).join(' | '));
    console.log(srv.log().split('\n').filter(l => /error|erro/i.test(l)).slice(-8).join('\n'));
  } finally {
    srv.filho.kill();
    arquivosCriados.forEach(arquivo => rmSync(arquivo, { force: true }));
  }
  const falhas = resultados.filter(x => !x.ok);
  for (const x of resultados) console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.nome}${x.ok ? '' : '  → ' + x.info}`);
  console.log(`\n${resultados.length - falhas.length}/${resultados.length} passaram`);
  process.exit(falhas.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
