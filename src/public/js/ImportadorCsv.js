/** Leitor de CSV/TSV que respeita cabeçalhos, aspas e separadores da planilha. */
export const ESQUEMAS_IMPORTACAO = {
  alunos: {
    matricula: ["aluno", "matricula", "matrícula", "ra", "registro academico", "registro acadêmico"],
    alunoNome: ["nome compl", "nome_compl", "nome completo", "nome aluno", "nome do aluno"],
    turma: ["turma pref", "turma_pref", "turma", "classe"],
    curso: ["curso"],
    serie: ["serie", "série"],
    situacao: ["sit aluno", "sit_aluno", "situacao", "situação"],
    ano: ["ano ref", "ano_ref", "ano", "ano letivo"],
    dataNascimento: ["aluno dt nasc", "aluno_dt_nasc", "data nascimento", "data de nascimento"],
    alunoRG: ["aluno rg", "aluno_rg", "rg"],
    alunoFone: ["aluno fone", "aluno_fone", "telefone aluno"],
    alunoEmail: ["aluno email", "aluno_email", "email aluno", "e-mail aluno"],
    alunoFoneCel: ["aluno fone cel", "aluno_fone_cel", "celular aluno"],
    paiNome: ["pai nome", "pai_nome"],
    paiFoneCel: ["pai fone cel", "pai_fone_cel", "celular pai"],
    paiFoneFixo: ["pai fone", "pai_fone", "telefone pai"],
    paiFoneRecado: ["pai fone recado", "pai_fone_recado"],
    paiEmail: ["pai email", "pai_email", "email pai", "e-mail pai"],
    maeNome: ["mae nome", "mãe nome", "mae_nome"],
    maeFoneCel: ["mae fone cel", "mãe fone cel", "mae_fone_cel", "celular mae", "celular mãe"],
    maeFoneFixo: ["mae fone", "mãe fone", "mae_fone", "telefone mae", "telefone mãe"],
    maeFoneRecado: ["mae fone recado", "mãe fone recado", "mae_fone_recado"],
    maeEmail: ["mae email", "mãe email", "mae_email", "email mae", "email mãe", "e-mail mãe"],
    finanNome: ["finan nome", "finan_nome", "financeiro nome"],
    finanFone: ["finan fone", "finan_fone", "financeiro fone"],
    legalNome: ["legal nome", "legal_nome", "responsavel legal", "responsável legal"],
    legalFone: ["legal fone", "legal_fone", "telefone responsavel legal", "telefone responsável legal"]
  },
  gradeHorarios: {
    turma: ["turma", "classe"],
    horaInicio: ["horainicialfinal", "horario inicial final", "horário inicial final", "hora inicio", "hora de inicio", "horario inicio", "horário início"],
    horaFim: ["horainicialfinal", "horario inicial final", "horário inicial final", "hora fim", "hora de fim", "horario fim", "horário fim"],
    dia: ["semana extenso", "semana_extenso", "dia", "dia semana", "dia da semana"],
    cod: ["disciplina", "cod", "codigo", "código", "codigo disciplina", "código disciplina"],
    disciplina: ["nome desciplina", "nome_desciplina", "nome disciplina", "nome_disciplina", "nome da disciplina", "materia", "matéria"]
  }
};

function normalizarTexto(valor) {
  return String(valor || "")
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pontuacaoCodificacao(texto) {
  return (texto.match(/[\uFFFDÃÂ]/g) || []).length;
}

/**
 * Datas e horas do Excel chegam como número serial. A conversão usa o código de
 * data do próprio Excel, sem fuso: `38425` → `14/03/2005` e `0,3125` → `07:30`.
 * (Com `cellDates`, o navegador aplicava o fuso e devolvia o dia anterior.)
 */
function converterDatasDaAba(aba) {
  const SSF = window.XLSX.SSF;
  const doisDigitos = numero => String(numero).padStart(2, "0");
  Object.keys(aba).forEach(endereco => {
    const celula = aba[endereco];
    if (endereco[0] === "!" || !celula || celula.t !== "n" || !celula.z || !SSF.is_date(celula.z)) return;
    const partes = SSF.parse_date_code(celula.v);
    if (!partes) return;
    const texto = celula.v < 1
      ? `${doisDigitos(partes.H)}:${doisDigitos(partes.M)}`
      : `${doisDigitos(partes.d)}/${doisDigitos(partes.m)}/${partes.y}`;
    aba[endereco] = { t: "s", v: texto, w: texto };
  });
}

function exportarPrimeiraAbaComoCsv(dados, codigoPagina) {
  const workbook = window.XLSX.read(dados, {
    type: "array",
    // Usa o valor original da célula, sem uma formatação intermediária que
    // poderia trocar caracteres acentuados por símbolos.
    cellText: false,
    cellDates: false,
    cellNF: true,
    raw: true,
    codepage: codigoPagina
  });
  const primeiraAba = workbook.SheetNames[0];
  if (!primeiraAba) return null;
  converterDatasDaAba(workbook.Sheets[primeiraAba]);

  return window.XLSX.utils.sheet_to_csv(workbook.Sheets[primeiraAba], {
    FS: ";",
    RS: "\n",
    blankrows: false,
    forceQuotes: true,
    raw: true
  });
}

/** Escolhe UTF-8 ou Windows-1252 antes que um acento inválido se perca. */
function decodificarTextoPlanilha(dados) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(dados);
  const windows1252 = new TextDecoder("windows-1252", { fatal: false }).decode(dados);
  return pontuacaoCodificacao(windows1252) < pontuacaoCodificacao(utf8) ? windows1252 : utf8;
}

function contarSeparadores(linha, separador) {
  let total = 0;
  let entreAspas = false;
  for (let indice = 0; indice < linha.length; indice += 1) {
    if (linha[indice] === '"') {
      if (entreAspas && linha[indice + 1] === '"') {
        indice += 1;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (!entreAspas && linha[indice] === separador) {
      total += 1;
    }
  }
  return total;
}

function descobrirSeparador(cabecalho) {
  return [";", ",", "\t"].reduce((melhor, candidato) =>
    contarSeparadores(cabecalho, candidato) > contarSeparadores(cabecalho, melhor) ? candidato : melhor
  , ";");
}

/**
 * Lê o texto inteiro respeitando aspas: uma célula entre aspas pode conter o separador,
 * aspas duplicadas ("") e quebras de linha, que viram espaço. Registros só com células
 * vazias (linhas de separadores, rodapés em branco) são ignorados. Cada registro guarda a
 * linha do arquivo em que começa, para as mensagens de erro apontarem o lugar certo.
 */
function lerRegistros(texto, separador) {
  const registros = [];
  let valores = [];
  let valor = "";
  let entreAspas = false;
  let linhaAtual = 1;
  let inicioRegistro = 1;
  const fecharRegistro = () => {
    valores.push(valor.trim());
    if (valores.some(celula => celula !== "")) registros.push({ valores, linha: inicioRegistro });
    valores = [];
    valor = "";
  };

  for (let indice = 0; indice < texto.length; indice += 1) {
    const caractere = texto[indice];
    if (caractere === '"') {
      if (entreAspas && texto[indice + 1] === '"') {
        valor += '"';
        indice += 1;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (caractere === "\r" || caractere === "\n") {
      if (caractere === "\r" && texto[indice + 1] === "\n") indice += 1;
      linhaAtual += 1;
      if (entreAspas) {
        valor += " ";
      } else {
        fecharRegistro();
        inicioRegistro = linhaAtual;
      }
    } else if (caractere === separador && !entreAspas) {
      valores.push(valor.trim());
      valor = "";
    } else {
      valor += caractere;
    }
  }
  fecharRegistro();
  return registros;
}

/**
 * Associa cada campo a uma coluna. Primeiro valem os nomes exatos; depois, só entre
 * as colunas ainda livres, um cabeçalho que contenha o apelido como palavras inteiras
 * (ex.: "TURMA PREF." para "turma pref").
 * O inverso — um cabeçalho curto como "ALUNO" contido no apelido "aluno fone" — não
 * vale, para uma coluna não ser lida como outro campo; cabeçalhos vazios são ignorados.
 */
function mapearCabecalhos(cabecalhos, esquema) {
  const normalizados = cabecalhos.map(normalizarTexto);
  const campos = Object.entries(esquema).map(([campo, apelidos]) => [campo, apelidos.map(normalizarTexto)]);
  const mapeamento = {};
  campos.forEach(([campo, apelidos]) => {
    const indice = normalizados.findIndex(cabecalho => cabecalho && apelidos.includes(cabecalho));
    if (indice >= 0) mapeamento[campo] = indice;
  });
  const usados = new Set(Object.values(mapeamento));
  campos.forEach(([campo, apelidos]) => {
    if (campo in mapeamento) return;
    const indice = normalizados.findIndex((cabecalho, posicao) =>
      cabecalho && !usados.has(posicao) && apelidos.some(apelido => ` ${cabecalho} `.includes(` ${apelido} `)));
    if (indice >= 0) {
      mapeamento[campo] = indice;
      usados.add(indice);
    }
  });
  return mapeamento;
}

/**
 * Converte uma planilha CSV ou TSV em objetos com os campos internos usados
 * pela API. A posição das colunas é irrelevante: os nomes do cabeçalho fazem o mapeamento.
 */
export function prepararImportacao(texto, esquema, obrigatorios, transformarLinha = null) {
  if (texto == null) {
    return { linhas: [], cabecalhos: [], mapeamento: {}, ausentes: [], finalizada: true };
  }
  const textoCompleto = String(texto || "");
  const primeiraLinha = textoCompleto.split(/\r?\n/).find(linha => linha.trim()) || "";
  const separador = descobrirSeparador(primeiraLinha);
  const registros = lerRegistros(textoCompleto, separador);
  if (registros.length < 2) {
    // Sem linhas de dados não há cabeçalho a reclamar: a tela avisa "planilha vazia".
    return { linhas: [], cabecalhos: [], mapeamento: {}, ausentes: [] };
  }

  const cabecalhos = registros[0].valores;
  const mapeamento = mapearCabecalhos(cabecalhos, esquema);
  const ausentes = obrigatorios.filter(campo => !(campo in mapeamento));

  const dados = registros.slice(1).map(({ valores, linha }) => {
    const objeto = { __linha: linha };
    Object.entries(mapeamento).forEach(([campo, coluna]) => {
      objeto[campo] = valores[coluna] || "";
    });
    return transformarLinha ? transformarLinha(objeto) : objeto;
  });

  return { linhas: dados, cabecalhos, mapeamento, ausentes };
}

/** `7`, `7h`, `07h30` ou `07:30` → `07:30`. */
function horarioHHMM(texto) {
  const partes = String(texto).trim().match(/^(\d{1,2})(?:\s*[:h]\s*(\d{2}))?\s*h?$/i);
  return partes ? `${partes[1].padStart(2, '0')}:${partes[2] || '00'}` : String(texto).trim();
}

/** Converte `10:50-11:40` ou `07h30-08h20` em horários separados e simplifica `quarta-feira`. */
export function normalizarLinhaGradeHorario(linha) {
  const horario = String(linha.horaInicio || linha.horaFim || '').trim();
  const partesHorario = horario.match(/^(\d{1,2}(?:\s*[:h]\s*\d{2})?\s*h?)\s*[-–]\s*(\d{1,2}(?:\s*[:h]\s*\d{2})?\s*h?)$/i);
  if (partesHorario) {
    linha.horaInicio = horarioHHMM(partesHorario[1]);
    linha.horaFim = horarioHHMM(partesHorario[2]);
  }

  const semanaExtenso = String(linha.dia || '').trim();
  if (semanaExtenso.includes('-')) {
    linha.dia = semanaExtenso.split('-')[0].trim();
  }
  return linha;
}

/**
 * PDFs de tabela normalmente preservam uma coluna por espaços repetidos. A conversão
 * mantém CSV/TSV já estruturados e transforma esse espaçamento em ponto e vírgula.
 */
function prepararTextoExtraidoDePdf(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .map(linha => linha.trim())
    .filter(Boolean)
    .map(linha => /[;,\t]/.test(linha) ? linha : linha.split(/\s{2,}/).join(';'))
    .join('\n');
}

/** Lê a primeira aba de arquivos CSV, TSV, Excel ou PDF com tabela textual. */
export async function lerArquivoPlanilha(arquivo, api = null) {
  if (arquivo == null) {
    return null;
  }
  const extensao = (arquivo.name.split('.').pop() || '').toLowerCase();
  if (extensao === 'pdf') {
    if (!api?.upload) {
      throw new Error('Leitor de PDF indisponível nesta tela. Entre novamente no sistema e tente de novo.');
    }
    const formulario = new FormData();
    formulario.append('arquivo', arquivo);
    const resposta = await api.upload('api/v1/importacoes/pdf', formulario);
    if (!resposta?.success) {
      throw new Error(resposta?.message || 'Não foi possível ler o PDF.');
    }
    return prepararTextoExtraidoDePdf(resposta.data?.texto);
  }
  if (["xlsx", "xls", "xlsm"].includes(extensao)) {
    if (!window.XLSX) {
      throw new Error("Leitor de planilhas Excel indisponível.");
    }
    const dados = await arquivo.arrayBuffer();
    // Arquivos XLS antigos podem não declarar corretamente sua página de código.
    // Lemos as duas codificações mais comuns e conservamos a que não introduz
    // caracteres substitutos ou texto corrompido.
    const codigosPagina = extensao === "xls" ? [1252, 65001] : [65001];
    const tentativas = codigosPagina
      .map(codigoPagina => exportarPrimeiraAbaComoCsv(dados, codigoPagina))
      .filter(texto => texto !== null);
    if (tentativas.length === 0) return null;
    return tentativas.sort((a, b) => pontuacaoCodificacao(a) - pontuacaoCodificacao(b))[0];
  }
  return decodificarTextoPlanilha(await arquivo.arrayBuffer());
}
