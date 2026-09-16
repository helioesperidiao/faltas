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

function lerLinha(linha, separador) {
  const valores = [];
  let valor = "";
  let entreAspas = false;

  for (let indice = 0; indice < linha.length; indice += 1) {
    const caractere = linha[indice];
    if (caractere === '"') {
      if (entreAspas && linha[indice + 1] === '"') {
        valor += '"';
        indice += 1;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (caractere === separador && !entreAspas) {
      valores.push(valor.trim());
      valor = "";
    } else {
      valor += caractere;
    }
  }
  valores.push(valor.trim());
  return valores;
}

function encontrarIndice(cabecalhos, apelidos) {
  const normalizados = apelidos.map(normalizarTexto);
  const exato = cabecalhos.findIndex(cabecalho => normalizados.includes(normalizarTexto(cabecalho)));
  if (exato >= 0) return exato;

  return cabecalhos.findIndex(cabecalho => {
    const normalizado = normalizarTexto(cabecalho);
    return normalizados.some(apelido => normalizado.includes(apelido) || apelido.includes(normalizado));
  });
}

/**
 * Converte uma planilha CSV ou TSV em objetos com os campos internos usados
 * pela API. A posição das colunas é irrelevante: os nomes do cabeçalho fazem o mapeamento.
 */
export function prepararImportacao(texto, esquema, obrigatorios, transformarLinha = null) {
  const linhas = String(texto || "").split(/\r?\n/).filter(linha => linha.trim());
  if (linhas.length < 2) {
    return { linhas: [], cabecalhos: [], mapeamento: {}, ausentes: obrigatorios };
  }

  const separador = descobrirSeparador(linhas[0]);
  const cabecalhos = lerLinha(linhas[0], separador);
  const mapeamento = Object.fromEntries(Object.entries(esquema)
    .map(([campo, apelidos]) => [campo, encontrarIndice(cabecalhos, apelidos)])
    .filter(([, indice]) => indice >= 0));
  const ausentes = obrigatorios.filter(campo => !(campo in mapeamento));

  const dados = linhas.slice(1).map((linha, indice) => {
    const valores = lerLinha(linha, separador);
    const objeto = { __linha: indice + 2 };
    Object.entries(mapeamento).forEach(([campo, coluna]) => {
      objeto[campo] = valores[coluna] || "";
    });
    return transformarLinha ? transformarLinha(objeto) : objeto;
  });

  return { linhas: dados, cabecalhos, mapeamento, ausentes };
}

/** Converte `10:50-11:40` em horários separados e simplifica `quarta-feira`. */
export function normalizarLinhaGradeHorario(linha) {
  const horario = String(linha.horaInicio || linha.horaFim || '').trim();
  const partesHorario = horario.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
  if (partesHorario) {
    linha.horaInicio = partesHorario[1];
    linha.horaFim = partesHorario[2];
  }

  const semanaExtenso = String(linha.dia || '').trim();
  if (semanaExtenso.includes('-')) {
    linha.dia = semanaExtenso.split('-')[0].trim();
  }
  return linha;
}

/** Lê a primeira aba de arquivos CSV, TSV e Excel sem alterar os cabeçalhos. */
export async function lerArquivoPlanilha(arquivo) {
  const extensao = (arquivo.name.split('.').pop() || '').toLowerCase();
  if (["xlsx", "xls", "xlsm"].includes(extensao)) {
    if (!window.XLSX) {
      throw new Error("Leitor de planilhas Excel indisponível.");
    }
    const dados = await arquivo.arrayBuffer();
    const workbook = window.XLSX.read(dados, { type: "array", cellText: true, cellDates: true });
    const primeiraAba = workbook.SheetNames[0];
    if (!primeiraAba) {
      throw new Error("A planilha não possui uma aba para importar.");
    }
    return window.XLSX.utils.sheet_to_csv(workbook.Sheets[primeiraAba], {
      FS: ";",
      RS: "\n",
      blankrows: false,
      forceQuotes: true,
      rawNumbers: false
    });
  }
  return arquivo.text();
}
