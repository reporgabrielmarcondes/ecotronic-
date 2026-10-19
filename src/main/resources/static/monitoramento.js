// ============================================================
//  Ecotronic Solutions — Painel de Monitoramento · lógica principal
// ============================================================
// Carregado como script comum (sem type="module"), no mesmo padrão do
// totem, para poder ser aberto direto do disco (file://) sem bloqueio
// de CORS em módulos ES.
// Supabase só autentica o administrador; os dados vêm da API Java (api.js).

// ---- Mesmo mapa de categorias/ícones do totem (mantido em sincronia) --
const CATEGORY_META = {
  celular:     { name: "Celular",                icon: "fa-solid fa-mobile-screen-button" },
  notebook:    { name: "Notebook",                icon: "fa-solid fa-laptop" },
  pci:         { name: "Placa de circuito (PCI)", icon: "fa-solid fa-microchip" },
  componentes: { name: "Componentes eletrônicos", icon: "fa-solid fa-microchip" },
  bateria:     { name: "Bateria comum",           icon: "fa-solid fa-car-battery" },
  litio:       { name: "Bateria de lítio",        icon: "fa-solid fa-battery-full" },
  eletro:      { name: "Eletrodoméstico pequeno", icon: "fa-solid fa-blender" },
  cabos:       { name: "Cabos e fios",            icon: "fa-solid fa-plug" },
  lampadas:    { name: "Lâmpadas",                icon: "fa-solid fa-lightbulb" },
  outros:      { name: "Outros resíduos",         icon: "fa-solid fa-box-open" },
};

// Um totem é considerado "ativo" se sincronizou nas últimas 24h.
const TOTEM_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 15;

// Mesmo esquema de login do usuario.js: nome -> e-mail fictício.
const EMAIL_DOMINIO = "ecotronic.com";
function nomeParaEmail(nome) {
  const slug = nome
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${slug}@${EMAIL_DOMINIO}`;
}

// ---- Referências de DOM · autenticação ------------------------------
const screenAuth = document.getElementById("screenAuth");
const screenDashboard = document.getElementById("screenDashboard");
const headerActions = document.getElementById("headerActions");
const authAlert = document.getElementById("authAlert");
const authForm = document.getElementById("authForm");
const authNome = document.getElementById("authNome");
const authSenha = document.getElementById("authSenha");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authSubmitLabel = document.getElementById("authSubmitLabel");
const authSpinner = document.getElementById("authSpinner");
const logoutBtn = document.getElementById("logoutBtn");

// ---- Cliente Supabase --------------------------------------
let db = null;
try {
  if (window.supabase && SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("SEU-PROJETO")) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn("Supabase não inicializado:", e);
}

// ---- Referências de DOM ------------------------------------
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const refreshBtn = document.getElementById("refreshBtn");
const lastUpdateLabel = document.getElementById("lastUpdateLabel");

const filterTotem = document.getElementById("filterTotem");
const filterCategoria = document.getElementById("filterCategoria");
const filterInicio = document.getElementById("filterInicio");
const filterFim = document.getElementById("filterFim");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const kpiTotalDescartes = document.getElementById("kpiTotalDescartes");
const kpiTotalEcodots = document.getElementById("kpiTotalEcodots");
const kpiTotens = document.getElementById("kpiTotens");
const kpiTopCategoria = document.getElementById("kpiTopCategoria");

const totemGrid = document.getElementById("totemGrid");
const tableBody = document.getElementById("tableBody");
const tableCount = document.getElementById("tableCount");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageLabel = document.getElementById("pageLabel");

let allRecords = [];   // todos os registros vindos do Supabase (sem filtro)
let filtered = [];     // após aplicar os filtros da UI
let currentPage = 1;
let chartDiario = null;
let chartCategorias = null;

// ---- Carregamento inicial -----------------------------------
async function init() {
  if (!db) {
    statusDot.classList.remove("bg-verde");
    statusDot.classList.add("bg-cinza");
    statusLabel.textContent = "Modo offline (Supabase não configurado)";
    renderEmptyState("Configure o Supabase em config.js para ver os dados.");
    return;
  }
  await loadData();
}

async function loadData() {
  statusLabel.textContent = "Sincronizando…";
  try {
    const accessToken = await obterAccessToken(db);
    const data = await apiFetch("/api/admin/descartes?limit=2000", { accessToken });

    allRecords = data || [];
    statusDot.classList.remove("bg-cinza", "bg-vermelho");
    statusDot.classList.add("bg-verde");
    statusLabel.textContent = "Conectado ao Supabase";
    lastUpdateLabel.textContent = `Atualizado às ${new Date().toLocaleTimeString("pt-BR")}`;

    populateFilterOptions();
    applyFilters();
  } catch (err) {
    console.error("Erro ao buscar descartes:", err);
    if (err.status === 401 || err.status === 403) {
      await db.auth.signOut();
      mostrarLogin();
      mostrarErroAuth("Sessão expirada ou sem permissão de administrador.");
      return;
    }
    statusDot.classList.remove("bg-verde");
    statusDot.classList.add("bg-vermelho");
    statusLabel.textContent = "Falha ao sincronizar";
    renderEmptyState("Não foi possível carregar os dados. Verifique a conexão.");
  }
}

// ---- Filtros ---------------------------------------------------
function populateFilterOptions() {
  const totens = [...new Set(allRecords.map((r) => r.totem_id).filter(Boolean))].sort();
  const categorias = [...new Set(allRecords.map((r) => r.categoria).filter(Boolean))].sort();

  const keepTotem = filterTotem.value;
  const keepCategoria = filterCategoria.value;

  filterTotem.innerHTML = '<option value="">Todos</option>' +
    totens.map((t) => `<option value="${t}">${t}</option>`).join("");
  filterCategoria.innerHTML = '<option value="">Todas</option>' +
    categorias.map((c) => `<option value="${c}">${categoryLabel(c)}</option>`).join("");

  filterTotem.value = totens.includes(keepTotem) ? keepTotem : "";
  filterCategoria.value = categorias.includes(keepCategoria) ? keepCategoria : "";
}

function applyFilters() {
  const totem = filterTotem.value;
  const categoria = filterCategoria.value;
  const inicio = filterInicio.value ? new Date(filterInicio.value + "T00:00:00") : null;
  const fim = filterFim.value ? new Date(filterFim.value + "T23:59:59") : null;

  filtered = allRecords.filter((r) => {
    const data = new Date(r.criado_em);
    if (totem && r.totem_id !== totem) return false;
    if (categoria && r.categoria !== categoria) return false;
    if (inicio && data < inicio) return false;
    if (fim && data > fim) return false;
    return true;
  });

  currentPage = 1;
  renderAll();
}

function clearFilters() {
  filterTotem.value = "";
  filterCategoria.value = "";
  filterInicio.value = "";
  filterFim.value = "";
  applyFilters();
}

// ---- Renderização geral -----------------------------------------
function renderAll() {
  renderKpis();
  renderTotens();
  renderCharts();
  renderTable();
}

function renderEmptyState(message) {
  tableBody.innerHTML = `<tr><td colspan="4" class="empty-row">${message}</td></tr>`;
  tableCount.textContent = "0 registros";
  [kpiTotalDescartes, kpiTotalEcodots, kpiTotens, kpiTopCategoria].forEach((el) => (el.textContent = "—"));
  totemGrid.innerHTML = "";
}

// ---- KPIs -----------------------------------------------------
function renderKpis() {
  const totalDescartes = filtered.length;
  const totalEcodots = filtered.reduce((sum, r) => sum + (Number(r.ecodots) || 0), 0);
  const totens = new Set(filtered.map((r) => r.totem_id).filter(Boolean));

  const porCategoria = {};
  filtered.forEach((r) => {
    porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + 1;
  });
  const topCategoriaId = Object.keys(porCategoria).sort((a, b) => porCategoria[b] - porCategoria[a])[0];

  kpiTotalDescartes.textContent = totalDescartes.toLocaleString("pt-BR");
  kpiTotalEcodots.textContent = totalEcodots.toLocaleString("pt-BR");
  kpiTotens.textContent = totens.size.toLocaleString("pt-BR");
  kpiTopCategoria.textContent = topCategoriaId ? categoryLabel(topCategoriaId) : "—";
}

// ---- Totens ------------------------------------------------------
function renderTotens() {
  const porTotem = {};
  filtered.forEach((r) => {
    const id = r.totem_id || "—";
    if (!porTotem[id]) porTotem[id] = { count: 0, ecodots: 0, ultima: null };
    porTotem[id].count += 1;
    porTotem[id].ecodots += Number(r.ecodots) || 0;
    const data = new Date(r.criado_em);
    if (!porTotem[id].ultima || data > porTotem[id].ultima) porTotem[id].ultima = data;
  });

  const ids = Object.keys(porTotem).sort();
  if (ids.length === 0) {
    totemGrid.innerHTML = '<p class="text-cinza text-sm col-span-full">Nenhum registro para os filtros atuais.</p>';
    return;
  }

  const now = Date.now();
  totemGrid.innerHTML = ids.map((id) => {
    const t = porTotem[id];
    const ativo = t.ultima && (now - t.ultima.getTime() < TOTEM_ACTIVE_WINDOW_MS);
    return `
      <div class="totem-card">
        <span class="totem-name">
          <span class="totem-dot ${ativo ? "bg-verde" : "bg-cinza"}"></span>
          Totem #${id}
        </span>
        <span class="totem-stat">${t.count.toLocaleString("pt-BR")} descartes · ${t.ecodots.toLocaleString("pt-BR")} ecodots</span>
        <span class="totem-stat">${t.ultima ? "Último: " + formatDateTime(t.ultima) : "Sem registros"}</span>
      </div>
    `;
  }).join("");
}

// ---- Gráficos ------------------------------------------------------
function renderCharts() {
  renderChartDiario();
  renderChartCategorias();
}

function renderChartDiario() {
  const porDia = {};
  filtered.forEach((r) => {
    const dia = new Date(r.criado_em).toLocaleDateString("pt-BR");
    porDia[dia] = (porDia[dia] || 0) + 1;
  });

  const dias = Object.keys(porDia).sort((a, b) => parseBrDate(a) - parseBrDate(b)).slice(-30);
  const valores = dias.map((d) => porDia[d]);

  const ctx = document.getElementById("chartDiario");
  if (chartDiario) chartDiario.destroy();
  chartDiario = new Chart(ctx, {
    type: "line",
    data: {
      labels: dias,
      datasets: [{
        label: "Descartes",
        data: valores,
        borderColor: "#2FAE55",
        backgroundColor: "rgba(47,174,85,0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function renderChartCategorias() {
  const porCategoria = {};
  filtered.forEach((r) => {
    porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + (Number(r.ecodots) || 0);
  });

  const categorias = Object.keys(porCategoria).sort((a, b) => porCategoria[b] - porCategoria[a]);
  const labels = categorias.map(categoryLabel);
  const valores = categorias.map((c) => porCategoria[c]);

  const ctx = document.getElementById("chartCategorias");
  if (chartCategorias) chartCategorias.destroy();
  chartCategorias = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Ecodots",
        data: valores,
        backgroundColor: "#2FAE55",
        borderRadius: 6,
        maxBarThickness: 26,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

// ---- Tabela + paginação -------------------------------------------
function renderTable() {
  tableCount.textContent = `${filtered.length.toLocaleString("pt-BR")} registro${filtered.length === 1 ? "" : "s"}`;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty-row">Nenhum registro para os filtros atuais.</td></tr>';
  } else {
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);
    tableBody.innerHTML = pageItems.map((r) => `
      <tr>
        <td>${formatDateTime(new Date(r.criado_em))}</td>
        <td>#${r.totem_id ?? "—"}</td>
        <td>${categoryLabel(r.categoria)}</td>
        <td class="text-right"><span class="ecodot-pill">${Number(r.ecodots) || 0}</span></td>
      </tr>
    `).join("");
  }

  pageLabel.textContent = `Página ${currentPage} de ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// ---- Utilidades -----------------------------------------------------
function categoryLabel(id) {
  return CATEGORY_META[id]?.name || id || "—";
}

function formatDateTime(date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseBrDate(str) {
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d).getTime();
}

// ---- Eventos -----------------------------------------------------
refreshBtn.addEventListener("click", loadData);
applyFiltersBtn.addEventListener("click", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);
prevPageBtn.addEventListener("click", () => { currentPage -= 1; renderTable(); });
nextPageBtn.addEventListener("click", () => { currentPage += 1; renderTable(); });

// Atualização automática a cada 30s, sem interromper filtros/paginação.
setInterval(() => { if (db && !screenDashboard.classList.contains("hidden")) loadData(); }, 30000);

// ---- Autenticação administrativa ------------------------------------
function mostrarErroAuth(msg) {
  authAlert.textContent = msg;
  authAlert.classList.remove("hidden");
}
function esconderErroAuth() {
  authAlert.classList.add("hidden");
  authAlert.textContent = "";
}
function setAuthCarregando(ligado) {
  authSubmitBtn.disabled = ligado;
  authSpinner.classList.toggle("hidden", !ligado);
}

function mostrarDashboard() {
  screenAuth.classList.add("hidden");
  screenDashboard.classList.remove("hidden");
  headerActions.classList.remove("hidden");
  headerActions.classList.add("flex");
  init();
}

function mostrarLogin() {
  screenDashboard.classList.add("hidden");
  headerActions.classList.add("hidden");
  headerActions.classList.remove("flex");
  screenAuth.classList.remove("hidden");
  authForm.reset();
}

// Pergunta à API Java se o usuário logado tem is_admin = true.
// A API também bloqueia (403) qualquer chamada de dados feita por não-admin.
async function ehAdministrador() {
  try {
    const accessToken = await obterAccessToken(db);
    const perfil = await apiFetch("/api/perfis/me", { accessToken });
    return !!perfil.admin;
  } catch (error) {
    console.error("Erro ao verificar permissão de administrador:", error);
    return false;
  }
}

authForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  esconderErroAuth();

  if (!db) {
    mostrarErroAuth("Supabase não configurado — confira o config.js.");
    return;
  }

  const nome = authNome.value.trim();
  const senha = authSenha.value;
  if (!nome || !senha) {
    mostrarErroAuth("Informe usuário e senha.");
    return;
  }

  setAuthCarregando(true);
  try {
    const email = nomeParaEmail(nome);
    const { data, error } = await db.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;

    const admin = await ehAdministrador(data.user.id);
    if (!admin) {
      await db.auth.signOut();
      mostrarErroAuth("Esta conta não tem permissão de administrador.");
      return;
    }

    mostrarDashboard();
  } catch (err) {
    console.error(err);
    const msg = (err?.message || "").toLowerCase();
    mostrarErroAuth(
      msg.includes("invalid login credentials")
        ? "Usuário ou senha incorretos."
        : "Não foi possível entrar. Tente novamente."
    );
  } finally {
    setAuthCarregando(false);
  }
});

logoutBtn.addEventListener("click", async () => {
  if (db) await db.auth.signOut();
  mostrarLogin();
});

// ---- Inicialização: exige sessão de admin antes de mostrar qualquer dado --
async function initAuthGate() {
  if (!db) {
    mostrarErroAuth("Supabase não configurado — confira o config.js.");
    return;
  }
  try {
    const { data } = await db.auth.getSession();
    const user = data?.session?.user;
    if (user && (await ehAdministrador(user.id))) {
      mostrarDashboard();
    } else {
      mostrarLogin();
    }
  } catch (err) {
    console.warn("Não foi possível restaurar a sessão:", err);
    mostrarLogin();
  }
}

initAuthGate();
