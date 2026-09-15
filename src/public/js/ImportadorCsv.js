/** Leitor de CSV/TSV que respeita cabeçalhos, aspas e separadores da planilha. */
export const ESQUEMAS_IMPORTACAO = {
  alunos: {
    matricula: ["matricula", "matrícula", "ra", "registro academico", "registro acadêmico"],
    alunoNome: ["aluno", "nome", "nome aluno", "nome do aluno", "aluno nome"],
    turma: ["turma", "classe"],
    curso: ["curso"],
    serie: ["serie", "série"],
    ano: ["ano", "ano letivo"]
  },
  gradeHorarios: {
    turma: ["turma", "classe"],
    horaInicio: ["hora inicio", "hora de inicio", "horario inicio", "horário início", "inicio", "início", "entrada", "inicio aula", "início aula"],
    horaFim: ["hora fim", "hora de fim", "horario fim", "horário fim", "fim", "saida", "saída", "fim aula"],
    dia: ["dia", "dia semana", "dia da semana"],
    cod: ["cod", "codigo", "código", "codigo disciplina", "código disciplina"],
    disciplina: ["disciplina", "materia", "matéria", "nome disciplina", "nome da disciplina"]
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
export function prepararImportacao(texto, esquema, obrigatorios) {
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
    return objeto;
  });

  return { linhas: dados, cabecalhos, mapeamento, ausentes };
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
