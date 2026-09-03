/**
 * Cabeçalho padrão UNIVAP (topbar + menu principal) para todas as páginas internas do sistema.
 *
 * Uso dentro de um <script type="module">:
 *   import { exigirSessao, montarTopbar } from './js/Topbar.js';
 *   const sessao = exigirSessao();
 *   if (sessao) { montarTopbar('chave-da-pagina'); }
 *
 * O menu é montado a partir do cargo do usuário logado. Nenhuma página deve escrever a
 * barra de navegação à mão: quando isso acontece, o menu passa a divergir do cargo real
 * (era o caso da tela de frequência, que tinha topbar e navbar fixas de administrador).
 */

/** Página para onde o usuário vai quando não há sessão ou quando confirma "Sair". */
const PAGINA_LOGIN = "Login.html";

/**
 * Todas as páginas internas do sistema, na ordem em que aparecem no menu.
 * `restrito: true` = só aparece para quem tem acesso total (ver CARGOS_ACESSO_TOTAL).
 * `descricao` é reaproveitada nos atalhos do painel inicial.
 */
const PAGINAS = [
  {
    chave: "dashboard",
    label: "Painel",
    href: "dashboard.html",
    restrito: false,
    descricao: "Visão geral do sistema e atalhos para os módulos liberados para você."
  },
  {
    chave: "chamada",
    label: "Chamada",
    href: "telaChamada.html",
    restrito: false,
    descricao: "Registre presença e falta dos alunos de uma turma, aluno por aluno."
  },
  {
    chave: "frequencia",
    label: "Frequência",
    href: "telaAdministrador.html",
    restrito: false,
    descricao: "Consulte a frequência da turma em uma data e gere o PDF para imprimir."
  },
  {
    chave: "abonos",
    label: "Abonos",
    href: "Abonos.html",
    restrito: false,
    descricao: "Justifique faltas e acompanhe os pedidos de abono dos alunos."
  },
  {
    chave: "alunos",
    label: "Alunos",
    href: "Alunos.html",
    restrito: true,
    descricao: "Cadastro dos alunos: matrícula, dados pessoais e turma."
  },
  {
    chave: "gradehorarios",
    label: "Grade de Horários",
    href: "GradeHorarios.html",
    restrito: true,
    descricao: "Turmas, disciplinas e horários de cada aula da semana."
  },
  {
    chave: "relatorios",
    label: "Relatórios",
    href: "Relatorios.html",
    restrito: true,
    descricao: "Relatórios de faltas e frequência por turma, aluno e período."
  },
  {
    chave: "cargos",
    label: "Cargos",
    href: "Cargos.html",
    restrito: true,
    descricao: "Cargos do sistema e as permissões de acesso de cada um."
  },
  {
    chave: "funcionarios",
    label: "Funcionários",
    href: "Funcionarios.html",
    restrito: true,
    descricao: "Cadastro de funcionários e vínculo de cada um com o seu cargo."
  }
];

/** Cargos que enxergam todos os módulos, inclusive os restritos. */
const CARGOS_ACESSO_TOTAL = [
  "Administrador",
  "Coordenador",
  "Diretor",
  "Processos Pedagógicos"
];

/** Compara cargos sem depender de acento, caixa ou espaço sobrando. */
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

const CARGOS_ACESSO_TOTAL_NORMALIZADOS = CARGOS_ACESSO_TOTAL.map(normalizar);

/** Escapa texto vindo do banco antes de jogá-lo em innerHTML. */
export function escaparHtml(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Lê a sessão gravada no localStorage.
 * Aceita as variações de formato que o backend pode devolver, para que o nome e o cargo
 * não sumam da tela só por causa do nível em que vieram dentro do JSON.
 */
export function lerSessao() {
  const bruto = localStorage.getItem("userData");
  if (!bruto) return null;

  let dados;
  try {
    dados = JSON.parse(bruto);
  } catch {
    return null;
  }
  if (!dados || typeof dados !== "object") return null;

  const usuario =
    dados?.data?.user ||
    dados?.data?.usuario ||
    dados?.user ||
    dados?.usuario ||
    dados?.data ||
    dados;

  const token = dados?.data?.token || dados?.token || dados?.accessToken || "";

  const nome =
    usuario?.nomeFuncionario ||
    usuario?.nomeUsuario ||
    usuario?.nome ||
    usuario?.name ||
    usuario?.login ||
    "";

  const cargoBruto = usuario?.cargo;
  const cargo =
    (typeof cargoBruto === "string" ? cargoBruto : cargoBruto?.nomeCargo) ||
    usuario?.nomeCargo ||
    usuario?.funcao ||
    usuario?.role ||
    "";

  return { token, usuario, nome, cargo };
}

/**
 * Garante que existe sessão. Se não houver, manda para o login e devolve null — quem
 * chama deve envolver a inicialização da página em `if (sessao) { ... }`, porque atribuir
 * window.location.href não interrompe a execução do script.
 */
export function exigirSessao() {
  const sessao = lerSessao();
  if (!sessao) {
    window.location.href = PAGINA_LOGIN;
    return null;
  }
  return sessao;
}

/** Diz se o cargo enxerga os módulos restritos. */
export function temAcessoTotal(cargo) {
  return CARGOS_ACESSO_TOTAL_NORMALIZADOS.includes(normalizar(cargo));
}

/**
 * Páginas que o cargo informado pode acessar, na ordem do menu.
 * Fonte única da regra de permissão: o menu e os atalhos do painel usam esta função,
 * para que os dois nunca discordem entre si.
 */
export function paginasPermitidas(cargo) {
  const acessoTotal = temAcessoTotal(cargo);
  return PAGINAS.filter(pagina => !pagina.restrito || acessoTotal);
}

/**
 * Injeta apenas o CSS que o css/univap-theme.css NÃO cobre.
 *
 * O tema já estiliza .topbar, .navbar, .brand, .session-info, .btn-sair, .skip-link e
 * marca a aba atual por [aria-current="page"] — repetir isso aqui sobrescreveria o tema
 * com cores fixas e faria o cabeçalho divergir do resto do sistema. Só entra aqui o que
 * o tema não tem: o relógio da sessão, o pop-up de confirmação de saída e a regra de
 * impressão. As cores saem das variáveis do próprio tema.
 */
function injetarEstilo() {
  if (document.getElementById("tb-estilo")) return;

  const estilo = document.createElement("style");
  estilo.id = "tb-estilo";
  estilo.textContent = `
    #app-topbar .session-relogio {
      display: block;
      font-size: 11.5px;
      color: #c9d7ec;
    }

    .tb-modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 42, 77, 0.55);
      z-index: 3000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .tb-modal-overlay.ativo {
      display: flex;
    }
    .tb-modal {
      background: #ffffff;
      border: 1px solid var(--univap-cinza-borda, #c7cbd1);
      border-radius: 6px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .tb-modal-corpo {
      padding: 24px 24px 8px 24px;
    }
    .tb-modal h2 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: var(--univap-azul-escuro, #0f2a4d);
    }
    .tb-modal p {
      margin: 0;
      font-size: 13.5px;
      color: #4a4f57;
      line-height: 1.5;
    }
    .tb-modal-acoes {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 18px 24px 22px 24px;
    }
    .tb-btn {
      border-radius: 4px;
      padding: 10px 20px;
      font-size: 13.5px;
      font-weight: bold;
      cursor: pointer;
      border: 1.5px solid transparent;
      font-family: inherit;
    }
    .tb-btn-secundario {
      background: #ffffff;
      border-color: var(--univap-cinza-borda, #c7cbd1);
      color: #4a4f57;
    }
    .tb-btn-perigo {
      background: var(--univap-vermelho, #a6231e);
      border-color: var(--univap-vermelho, #a6231e);
      color: #ffffff;
    }
    .tb-btn-perigo:hover {
      filter: brightness(0.9);
    }

    @media print {
      #app-topbar,
      .tb-modal-overlay {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(estilo);
}

/** Cria (uma única vez) o pop-up de confirmação de saída e devolve a função que o abre. */
function prepararConfirmacaoDeSaida() {
  let overlay = document.getElementById("tb-modal-sair");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tb-modal-sair";
    overlay.className = "tb-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "tb-modal-sair-titulo");
    overlay.innerHTML = `
      <div class="tb-modal">
        <div class="tb-modal-corpo">
          <h2 id="tb-modal-sair-titulo">Sair do sistema</h2>
          <p>Tem certeza que deseja sair? Você precisará entrar novamente com seu login e senha.</p>
        </div>
        <div class="tb-modal-acoes">
          <button type="button" class="tb-btn tb-btn-secundario" id="tb-sair-cancelar">Cancelar</button>
          <button type="button" class="tb-btn tb-btn-perigo" id="tb-sair-confirmar">Sair</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const fechar = () => {
      overlay.classList.remove("ativo");
      document.removeEventListener("keydown", overlay._aoTeclar);
    };

    overlay._aoTeclar = evento => {
      if (evento.key === "Escape") fechar();
    };

    overlay.querySelector("#tb-sair-cancelar").addEventListener("click", fechar);
    overlay.querySelector("#tb-sair-confirmar").addEventListener("click", () => {
      localStorage.removeItem("userData");
      window.location.href = PAGINA_LOGIN;
    });
    overlay.addEventListener("click", evento => {
      if (evento.target === overlay) fechar();
    });
  }

  return () => {
    overlay.classList.add("ativo");
    document.addEventListener("keydown", overlay._aoTeclar);
    overlay.querySelector("#tb-sair-cancelar").focus();
  };
}

/** Data e hora exibidas na topbar. */
function textoDataHora() {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()} - ${hora}:${min}`;
}

/**
 * Monta o cabeçalho dentro de <div id="app-topbar"></div>.
 * @param {string} paginaAtiva chave da página atual (ver PAGINAS).
 */
export function montarTopbar(paginaAtiva) {
  const alvo = document.getElementById("app-topbar");
  if (!alvo) return;

  injetarEstilo();

  const sessao = lerSessao();
  const nome = sessao?.nome || "Usuário";
  const cargo = sessao?.cargo || "";

  const itensMenu = paginasPermitidas(cargo)
    .map(pagina => {
      const atual = pagina.chave === paginaAtiva;
      const marcacao = atual ? ' class="ativo" aria-current="page"' : "";
      return `<li><a href="${pagina.href}"${marcacao}>${escaparHtml(pagina.label)}</a></li>`;
    })
    .join("");

  alvo.innerHTML = `
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
        USUÁRIO: <strong>${escaparHtml(nome.toUpperCase())}</strong>${cargo ? " · " + escaparHtml(cargo) : ""}
        <span class="session-relogio" id="tb-relogio">${textoDataHora()}</span>
        <button type="button" class="btn-sair" id="btn-sair-sistema">Sair</button>
      </div>
    </header>
    <nav class="navbar" aria-label="Menu principal">
      <ul>${itensMenu}</ul>
    </nav>
  `;

  const abrirConfirmacao = prepararConfirmacaoDeSaida();
  alvo.querySelector("#btn-sair-sistema").addEventListener("click", abrirConfirmacao);

  if (montarTopbar._relogio) clearInterval(montarTopbar._relogio);
  montarTopbar._relogio = setInterval(() => {
    const campo = document.getElementById("tb-relogio");
    if (campo) campo.textContent = textoDataHora();
  }, 30000);
}
