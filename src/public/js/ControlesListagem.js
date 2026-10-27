/*
 * Controles visuais reutilizáveis para as tabelas do sistema. A busca trabalha
 * somente com o conteúdo já carregado na tela; assim não cria novas consultas
 * nem muda os filtros específicos de cada módulo.
 */
const estados = new WeakMap();

function textoNormalizado(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function paresDeLinhas(tbody) {
  const linhas = Array.from(tbody.rows);
  const pares = [];
  for (let indice = 0; indice < linhas.length; indice += 1) {
    const principal = linhas[indice];
    if (principal.classList.contains('linha-funcionarios')) continue;
    const detalhe = linhas[indice + 1]?.classList.contains('linha-funcionarios')
      ? linhas[indice + 1]
      : null;
    pares.push({ principal, detalhe });
  }
  return pares;
}

/**
 * Acrescenta lupa, campo de busca e ordenação A–Z/Z–A a uma tabela renderizada.
 * @param {HTMLElement} destino elemento que contém a tabela.
 * @param {HTMLTableElement} tabela tabela a controlar.
 * @param {{colunaOrdenacao?: number}} opcoes coluna usada na ordenação (zero-indexada).
 */
export function montarControlesListagem(destino, tabela, opcoes = {}) {
  if (!destino || !tabela || !tabela.tBodies[0]) return;

  const estado = estados.get(destino) || { busca: '', direcao: 0 };
  estados.set(destino, estado);
  const colunaOrdenacao = opcoes.colunaOrdenacao ?? 0;
  const toolbar = document.createElement('div');
  toolbar.className = 'controles-listagem';
  toolbar.innerHTML = `
    <label class="campo-pesquisa-listagem">
      <span aria-hidden="true">🔎</span>
      <span class="sr-only">Pesquisar na listagem</span>
      <input type="search" placeholder="Pesquisar na lista" aria-label="Pesquisar na listagem" autocomplete="off">
    </label>
    <div class="ordenacao-listagem" role="group" aria-label="Ordenar listagem">
      <button type="button" class="btn btn-outline-secondary btn-sm" data-ordem="1">A–Z</button>
      <button type="button" class="btn btn-outline-secondary btn-sm" data-ordem="-1">Z–A</button>
      <button type="button" class="btn btn-outline-secondary btn-sm" data-limpar>Limpar</button>
    </div>`;

  const input = toolbar.querySelector('input');
  input.value = estado.busca;
  destino.insertBefore(toolbar, tabela);

  function aplicar() {
    const tbody = tabela.tBodies[0];
    const pares = paresDeLinhas(tbody);
    const consulta = textoNormalizado(estado.busca.trim());
    const ordenados = !estado.direcao ? pares : [...pares].sort((a, b) => {
      const primeiro = textoNormalizado(a.principal.cells[colunaOrdenacao]?.textContent);
      const segundo = textoNormalizado(b.principal.cells[colunaOrdenacao]?.textContent);
      return primeiro.localeCompare(segundo, 'pt-BR', { numeric: true }) * estado.direcao;
    });

    ordenados.forEach(par => {
      tbody.appendChild(par.principal);
      if (par.detalhe) tbody.appendChild(par.detalhe);
      const encontrado = !consulta || textoNormalizado(par.principal.textContent).includes(consulta)
        || Boolean(par.detalhe && textoNormalizado(par.detalhe.textContent).includes(consulta));
      par.principal.hidden = !encontrado;
      if (par.detalhe) par.detalhe.hidden = !encontrado;
    });
  }

  input.addEventListener('input', () => {
    estado.busca = input.value;
    aplicar();
  });
  toolbar.querySelectorAll('[data-ordem]').forEach(botao => {
    botao.addEventListener('click', () => {
      estado.direcao = Number(botao.dataset.ordem);
      aplicar();
    });
  });
  toolbar.querySelector('[data-limpar]').addEventListener('click', () => {
    estado.busca = '';
    estado.direcao = 0;
    input.value = '';
    aplicar();
    input.focus();
  });

  aplicar();
}
