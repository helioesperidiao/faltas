/**
 * Monta o cabeçalho (topbar + menu) padrão UNIVAP em todas as páginas internas do sistema.
 * Uso: importar e chamar montarTopbar('chave-da-pagina-atual') dentro de um <script type="module">.
 */

const PAGINAS = [
  { chave: "dashboard", label: "Painel", href: "dashboard.html" },
  { chave: "chamada", label: "Chamada", href: "telaChamada.html" },
  { chave: "movimentacoes", label: "Entradas e Saídas", href: "Movimentacoes.html" },
  { chave: "frequencia", label: "Frequência", href: "telaAdministrador.html" },
  { chave: "alunos", label: "Alunos", href: "Alunos.html" },
  { chave: "gradehorarios", label: "Grade de Horários", href: "GradeHorarios.html" },
  { chave: "abonos", label: "Abonos", href: "Abonos.html" },
  { chave: "relatorios", label: "Relatórios", href: "Relatorios.html" },
  { chave: "cargos", label: "Cargos", href: "Cargos.html" },
  { chave: "funcionarios", label: "Funcionários", href: "Funcionarios.html" }
];

function pegarUsuarioLogado() {
  const bruto = localStorage.getItem("userData");
  if (!bruto) return null;
  try {
    const dados = JSON.parse(bruto);
    const funcionario = dados?.data?.funcionario?.[0];
    return funcionario || null;
  } catch {
    return null;
  }
}

function sair() {
  localStorage.removeItem("userData");
  window.location.href = "Login.html";
}

export function montarTopbar(paginaAtiva) {
  const usuario = pegarUsuarioLogado();
  const nome = usuario?.nomeFuncionario || "Usuário";
  const cargo = usuario?.cargo?.nomeCargo || "";

  const itensMenu = PAGINAS.map(pagina => {
    const atual = pagina.chave === paginaAtiva;
    return `<li><a href="${pagina.href}"${atual ? ' aria-current="page"' : ''}>${pagina.label}</a></li>`;
  }).join("");

  const html = `
    <a href="#conteudo-principal" class="skip-link">Pular para o conteúdo</a>
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">U</div>
        <div>
          <div class="brand-text">UNIVAP</div>
          <div class="brand-sub">Sistema de Controle de Faltas</div>
        </div>
      </div>
      <div class="session-info">
        USUÁRIO: <strong>${nome.toUpperCase()}</strong>${cargo ? ' · ' + cargo : ''}
        <button type="button" class="btn-sair" id="btn-sair-sistema">Sair</button>
      </div>
    </header>
    <nav class="navbar" aria-label="Menu principal">
      <ul>${itensMenu}</ul>
    </nav>
  `;

  const alvo = document.getElementById("app-topbar");
  if (alvo) {
    alvo.innerHTML = html;
    const botaoSair = document.getElementById("btn-sair-sistema");
    if (botaoSair) botaoSair.onclick = sair;
  }
}
