// ============================================================
//  Ecotronic Solutions — Totem de Descarte · lógica principal
// ============================================================
// Este arquivo é carregado como script comum (sem type="module") de propósito:
// abrir o totem direto do disco (file://) bloqueia módulos ES por CORS.
// API_URL, TOTEM_API_KEY e TOTEM_ID vêm de config.js; apiFetch() vem de api.js.
// O totem fala só com a API Java — o Supabase não é usado aqui.

// ---- Ícones (Font Awesome) ---------------------------------
const ICONS = {
  celular: "fa-solid fa-mobile-screen-button",
  notebook: "fa-solid fa-laptop",
  pci: "fa-solid fa-microchip",
  componentes: "fa-solid fa-microchip",
  bateria: "fa-solid fa-car-battery",
  litio: "fa-solid fa-battery-full",
  eletro: "fa-solid fa-blender",
  cabos: "fa-solid fa-plug",
  lampadas: "fa-solid fa-lightbulb",
  outros: "fa-solid fa-box-open",
};

// ---- Categorias -----------------------------------------------
// min/max define a faixa de ecodots sorteada a cada descarte.
const CATEGORIES = [
  { id: "celular",     name: "Celular",                 icon: "celular",     min: 50,  max: 80  },
  { id: "notebook",    name: "Notebook",                 icon: "notebook",    min: 150, max: 250 },
  { id: "pci",         name: "Placa de circuito (PCI)",  icon: "pci",         min: 100, max: 150 },
  { id: "componentes", name: "Componentes eletrônicos",  icon: "componentes", min: 30,  max: 60  },
  { id: "bateria",     name: "Bateria comum",            icon: "bateria",     min: 40,  max: 70  },
  { id: "litio",       name: "Bateria de lítio",         icon: "litio",       min: 60,  max: 100 },
  { id: "eletro",      name: "Eletrodoméstico pequeno",  icon: "eletro",      min: 80,  max: 120 },
  { id: "cabos",       name: "Cabos e fios",             icon: "cabos",       min: 20,  max: 40  },
  { id: "lampadas",    name: "Lâmpadas",                 icon: "lampadas",    min: 15,  max: 30  },
  { id: "outros",      name: "Outros resíduos",          icon: "outros",      min: 10,  max: 25  },
];

// ---- Referências de DOM ---------------------------------------
const screenToken = document.getElementById("screenToken");
const tokenForm = document.getElementById("tokenForm");
const tokenInput = document.getElementById("tokenInput");
const tokenConfirmBtn = document.getElementById("tokenConfirmBtn");
const tokenConfirmLabel = document.getElementById("tokenConfirmLabel");
const tokenSpinner = document.getElementById("tokenSpinner");
const tokenSkipBtn = document.getElementById("tokenSkipBtn");
const tokenError = document.getElementById("tokenError");

const screenSelect = document.getElementById("screenSelect");
const usuarioBadge = document.getElementById("usuarioBadge");
const usuarioBadgeNome = document.getElementById("usuarioBadgeNome");
const trocarUsuarioBtn = document.getElementById("trocarUsuarioBtn");

const grid = document.getElementById("categoryGrid");
const overlayConfirm = document.getElementById("overlayConfirm");
const overlayCheck = document.getElementById("overlayCheck");
const overlayResult = document.getElementById("overlayResult");
const confirmTitle = document.getElementById("confirmTitle");
const confirmIconWrap = document.getElementById("confirmIconWrap");
const confirmBtn = document.getElementById("confirmBtn");
const resultCategoryLabel = document.getElementById("resultCategoryLabel");
const ecodotCountEl = document.getElementById("ecodotCount");
const dotBurst = document.getElementById("dotBurst");
const newDiscardBtn = document.getElementById("newDiscardBtn");
const countdownEl = document.getElementById("countdown");
const syncLabel = document.getElementById("syncLabel");
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const totemIdEl = document.getElementById("totemId");

totemIdEl.textContent = `Totem #${TOTEM_ID}`;

// Indicador de conexão com a API Java (checado a cada 30s).
async function checarServidor() {
  let ok = true;
  try { await apiFetch("/api/health"); } catch (e) { ok = false; }
  statusDot.classList.toggle("bg-verde", ok);
  statusDot.classList.toggle("bg-vermelho", !ok);
  statusLabel.textContent = ok ? "Totem conectado" : "Servidor offline";
}
checarServidor();
setInterval(checarServidor, 30000);

let selectedCategory = null;
let countdownTimer = null;
let usuarioAtual = null; // { nome, token } | null — quem está descartando agora

// ---- Tela 0: identificação por token ------------------------------
function showTokenScreen() {
  usuarioAtual = null;
  tokenInput.value = "";
  esconderErroToken();
  screenSelect.classList.add("hidden");
  screenToken.classList.remove("hidden");
  tokenInput.focus();
}

function showSelectScreen() {
  screenToken.classList.add("hidden");
  screenSelect.classList.remove("hidden");

  if (usuarioAtual) {
    usuarioBadgeNome.textContent = usuarioAtual.nome;
    usuarioBadge.classList.remove("hidden");
    usuarioBadge.classList.add("inline-flex");
  } else {
    usuarioBadge.classList.add("hidden");
    usuarioBadge.classList.remove("inline-flex");
  }
}

function mostrarErroToken(msg) {
  tokenError.textContent = msg;
  tokenError.classList.remove("hidden");
}
function esconderErroToken() {
  tokenError.classList.add("hidden");
  tokenError.textContent = "";
}

tokenForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  esconderErroToken();

  const codigo = tokenInput.value.trim();
  if (!codigo) {
    mostrarErroToken("Digite o código ou toque em \"Pular\".");
    return;
  }
  tokenConfirmBtn.disabled = true;
  tokenSpinner.classList.remove("hidden");
  try {
    const data = await apiFetch("/api/totem/validar-token", {
      method: "POST",
      totem: true,
      body: { token: codigo },
    });
    usuarioAtual = { nome: data.nome, token: codigo };
    showSelectScreen();
  } catch (err) {
    if (err.status === 404) {
      mostrarErroToken("Código não encontrado. Confira e tente de novo.");
    } else if (err.status === 429) {
      mostrarErroToken("Muitas tentativas incorretas. Aguarde um minuto.");
    } else {
      console.error("Erro ao validar token:", err);
      mostrarErroToken("Não foi possível validar o código agora. Tente novamente.");
    }
  } finally {
    tokenConfirmBtn.disabled = false;
    tokenSpinner.classList.add("hidden");
  }
});

tokenSkipBtn.addEventListener("click", () => {
  usuarioAtual = null;
  showSelectScreen();
});

trocarUsuarioBtn.addEventListener("click", showTokenScreen);

// ---- Renderiza grid de categorias ------------------------------
function renderGrid() {
  grid.innerHTML = CATEGORIES.map((c) => `
    <button class="category-tile" data-id="${c.id}" type="button">
      <span class="category-icon"><i class="${ICONS[c.icon]}"></i></span>
      <span>
        <span class="category-name block">${c.name}</span>
        <span class="category-points">até ${c.max} ecodots</span>
      </span>
    </button>
  `).join("");

  grid.querySelectorAll(".category-tile").forEach((btn) => {
    btn.addEventListener("click", () => openConfirm(btn.dataset.id));
  });
}
renderGrid();

// ---- Passo 1: confirmação --------------------------------------
function openConfirm(id) {
  selectedCategory = CATEGORIES.find((c) => c.id === id);
  if (!selectedCategory) return;
  confirmTitle.textContent = selectedCategory.name;
  confirmIconWrap.innerHTML = `<i class="${ICONS[selectedCategory.icon]}"></i>`;
  overlayConfirm.classList.add("is-open");
  overlayConfirm.classList.remove("hidden");
}
function closeConfirm() {
  overlayConfirm.classList.remove("is-open");
  overlayConfirm.classList.add("hidden");
}
overlayConfirm.querySelectorAll("[data-close-confirm]").forEach((el) =>
  el.addEventListener("click", closeConfirm)
);

confirmBtn.addEventListener("click", async () => {
  closeConfirm();
  await runCheckAndResult(selectedCategory);
});

// ---- Passo 2 + 3: check animado e resultado ---------------------
async function runCheckAndResult(category) {
  overlayCheck.classList.remove("hidden");
  overlayCheck.classList.add("is-open");

  // A API Java sorteia e grava os ecodots; a animação (~900ms) roda em paralelo.
  let ecodots = null;
  let erro = null;
  await Promise.all([
    registrarDescarte(category).then((v) => { ecodots = v; }).catch((e) => { erro = e; }),
    wait(1100),
  ]);

  overlayCheck.classList.remove("is-open");
  overlayCheck.classList.add("hidden");

  if (erro) {
    tratarErroDescarte(erro);
    return;
  }
  showResult(category, ecodots);
}

// ---- Passo 4: tela de resultado ----------------------------------
function showResult(category, ecodots) {
  resultCategoryLabel.textContent = category.name;
  ecodotCountEl.textContent = "0";
  overlayResult.classList.remove("hidden");
  overlayResult.classList.add("is-open");

  animateCount(ecodotCountEl, ecodots, 800);
  burstDots(Math.min(10, Math.max(4, Math.round(ecodots / 20))));

  let secondsLeft = 6;
  countdownEl.textContent = secondsLeft;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    secondsLeft -= 1;
    countdownEl.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      closeResult();
    }
  }, 1000);
}

function closeResult() {
  clearInterval(countdownTimer);
  overlayResult.classList.remove("is-open");
  overlayResult.classList.add("hidden");
  dotBurst.innerHTML = "";
  selectedCategory = null;
  // Volta para a identificação por token, para o próximo usuário se identificar.
  showTokenScreen();
}
newDiscardBtn.addEventListener("click", closeResult);

// ---- API Java: grava o descarte -----------------------------------
async function registrarDescarte(category) {
  const r = await apiFetch("/api/totem/descartes", {
    method: "POST",
    totem: true,
    body: {
      totemId: TOTEM_ID,
      categoria: category.id,
      token: usuarioAtual ? usuarioAtual.token : null,
    },
  });
  syncLabel.textContent = "Sincronizado com a central de resíduos";
  return r.ecodots;
}

function tratarErroDescarte(err) {
  console.error("Erro ao registrar descarte:", err);
  syncLabel.textContent = "Falha ao sincronizar — verifique a conexão";
  if (err.status === 404) {
    alert("Seu código não é mais válido. Identifique-se novamente.");
    showTokenScreen();
  } else if (err.status === 429) {
    alert("Muitas tentativas incorretas. Aguarde um minuto.");
  } else {
    alert("Não foi possível registrar o descarte. Tente novamente.");
  }
}

// ---- Utilidades -----------------------------------------------------
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateCount(el, target, duration) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cúbico
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function burstDots(count) {
  dotBurst.innerHTML = "";
  const centerX = 50; // % do container
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    dot.className = "ecodot";
    const angle = (Math.PI / (count + 1)) * (i + 1) + Math.PI; // leque para cima
    const dist = 90 + Math.random() * 60;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    dot.style.setProperty("--dot-end", `translate(${dx}px, ${dy}px) scale(1)`);
    dot.style.left = `calc(${centerX}% + ${(Math.random() - 0.5) * 40}px)`;
    dot.style.animationDelay = `${i * 0.03}s`;
    dotBurst.appendChild(dot);
  }
}
