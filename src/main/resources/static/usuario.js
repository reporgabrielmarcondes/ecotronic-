// ============================================================
//  Ecotronic Solutions — Minha Conta · lógica principal
// ============================================================
// Carregado como script comum (sem type="module"), no mesmo padrão dos
// outros apps deste projeto. SUPABASE_URL e SUPABASE_ANON_KEY (config.js) servem
// só para login; perfil, código do totem e descartes vêm da API Java (api.js).
//
// Login simplificado: o usuário só informa nome + senha. Internamente
// isso vira um login por e-mail fictício no Supabase Auth
// (nome -> "nome.sobrenome@ecotronic.local"), então o "nome" funciona
// como um nome de usuário único.

const EMAIL_DOMINIO = "ecotronic.com";
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
const screenAuth = document.getElementById("screenAuth");
const screenDashboard = document.getElementById("screenDashboard");
const headerUserArea = document.getElementById("headerUserArea");
const headerNome = document.getElementById("headerNome");
const logoutBtn = document.getElementById("logoutBtn");

const authTitle = document.getElementById("authTitle");
const authAlert = document.getElementById("authAlert");
const authForm = document.getElementById("authForm");
const authNome = document.getElementById("authNome");
const authSenha = document.getElementById("authSenha");
const authSenhaConfirmaWrap = document.getElementById("authSenhaConfirmaWrap");
const authSenhaConfirma = document.getElementById("authSenhaConfirma");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authSubmitLabel = document.getElementById("authSubmitLabel");
const authSpinner = document.getElementById("authSpinner");
const authToggleText = document.getElementById("authToggleText");
const authToggleBtn = document.getElementById("authToggleBtn");

const saldoEcodots = document.getElementById("saldoEcodots");
const tokenValue = document.getElementById("tokenValue");
const copyTokenBtn = document.getElementById("copyTokenBtn");
const historicoList = document.getElementById("historicoList");

const toggleEditBtn = document.getElementById("toggleEditBtn");
const toggleEditIcon = document.getElementById("toggleEditIcon");
const editPanel = document.getElementById("editPanel");
const editAlert = document.getElementById("editAlert");
const editSuccess = document.getElementById("editSuccess");
const editNome = document.getElementById("editNome");
const editSenha = document.getElementById("editSenha");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const regenTokenBtn = document.getElementById("regenTokenBtn");

let modo = "login"; // "login" | "cadastro"
let perfilAtual = null; // { id, nome, token }

// ---- Utilidades -----------------------------------------------------
function slugifyNome(nome) {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function nomeParaEmail(nome) {
  const slug = slugifyNome(nome);
  return `${slug}@${EMAIL_DOMINIO}`;
}

function mostrarAlerta(el, mensagem) {
  el.textContent = mensagem;
  el.classList.remove("hidden");
}
function esconderAlerta(el) {
  el.classList.add("hidden");
  el.textContent = "";
}

function mensagemErroAuth(err) {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "Esse nome já está em uso. Escolha outro ou faça login.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Nome ou senha incorretos.";
  }
  if (msg.includes("password") && msg.includes("6")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  return err?.message || "Não foi possível concluir. Tente novamente.";
}

// ---- Alternância login / cadastro -------------------------------
function setModo(novoModo) {
  modo = novoModo;
  esconderAlerta(authAlert);
  if (modo === "cadastro") {
    authTitle.textContent = "Criar minha conta";
    authSubmitLabel.textContent = "Cadastrar";
    authSenhaConfirmaWrap.classList.remove("hidden");
    authSenhaConfirma.required = true;
    authSenha.autocomplete = "new-password";
    authToggleText.textContent = "Já tem conta?";
    authToggleBtn.textContent = "Entrar";
  } else {
    authTitle.textContent = "Entrar na minha conta";
    authSubmitLabel.textContent = "Entrar";
    authSenhaConfirmaWrap.classList.add("hidden");
    authSenhaConfirma.required = false;
    authSenha.autocomplete = "current-password";
    authToggleText.textContent = "Ainda não tem conta?";
    authToggleBtn.textContent = "Cadastre-se";
  }
}
authToggleBtn.addEventListener("click", () => setModo(modo === "login" ? "cadastro" : "login"));

// ---- Envio do formulário de auth ---------------------------------
authForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  esconderAlerta(authAlert);

  if (!db) {
    mostrarAlerta(authAlert, "Supabase não configurado — confira o config.js.");
    return;
  }

  const nome = authNome.value.trim();
  const senha = authSenha.value;

  if (!nome) {
    mostrarAlerta(authAlert, "Informe seu nome.");
    return;
  }
  if (modo === "cadastro" && senha !== authSenhaConfirma.value) {
    mostrarAlerta(authAlert, "As senhas não coincidem.");
    return;
  }

  setCarregando(true);
  try {
    if (modo === "cadastro") {
      await cadastrar(nome, senha);
    } else {
      await entrar(nome, senha);
    }
  } catch (err) {
    console.error(err);
    mostrarAlerta(authAlert, mensagemErroAuth(err));
  } finally {
    setCarregando(false);
  }
});

function setCarregando(ligado) {
  authSubmitBtn.disabled = ligado;
  authSpinner.classList.toggle("hidden", !ligado);
}

async function cadastrar(nome, senha) {
  const email = nomeParaEmail(nome);

  const { data, error } = await db.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Cadastro criado, mas não foi possível iniciar a sessão automaticamente.");

  // O perfil (nome + código do totem) fica no banco Java; o Supabase só autentica.
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Conta criada, mas é preciso confirmar o e-mail antes de entrar.");
  await apiFetch("/api/perfis", { method: "POST", body: { nome }, accessToken });

  await carregarDashboard();
}

async function entrar(nome, senha) {
  const email = nomeParaEmail(nome);
  const { error } = await db.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  await carregarDashboard();
}

logoutBtn.addEventListener("click", async () => {
  if (db) await db.auth.signOut();
  perfilAtual = null;
  authForm.reset();
  setModo("login");
  headerUserArea.classList.add("hidden");
  headerUserArea.classList.remove("flex");
  screenDashboard.classList.add("hidden");
  screenAuth.classList.remove("hidden");
});

// ---- Carrega e renderiza o dashboard -----------------------------
async function carregarDashboard() {
  const { data: sessionData } = await db.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return;

  const accessToken = sessionData.session.access_token;
  let perfil;
  try {
    perfil = await apiFetch("/api/perfis/me", { accessToken });
  } catch (err) {
    if (err.status !== 404) throw err;
    // Conta existe no Supabase mas ainda não tem perfil no banco Java: cria agora.
    const nomeMeta = user.user_metadata?.nome;
    if (!nomeMeta) throw err;
    perfil = await apiFetch("/api/perfis", { method: "POST", body: { nome: nomeMeta }, accessToken });
  }
  perfilAtual = perfil;

  const descartes = await apiFetch("/api/perfis/me/descartes", { accessToken });

  renderDashboard(perfil, descartes || []);

  screenAuth.classList.add("hidden");
  screenDashboard.classList.remove("hidden");
  headerUserArea.classList.remove("hidden");
  headerUserArea.classList.add("flex");
  headerNome.textContent = perfil.nome;
}

function renderDashboard(perfil, descartes) {
  const saldo = descartes.reduce((soma, d) => soma + (Number(d.ecodots) || 0), 0);
  saldoEcodots.textContent = saldo.toLocaleString("pt-BR");
  tokenValue.textContent = perfil.token;
  editNome.value = perfil.nome;
  editSenha.value = "";

  if (descartes.length === 0) {
    historicoList.innerHTML = '<p class="text-cinza text-sm">Você ainda não fez nenhum descarte.</p>';
    return;
  }

  historicoList.innerHTML = descartes.map((d) => `
    <div class="historico-item">
      <span class="hi-info">
        <span class="hi-categoria">${categoryLabel(d.categoria)}</span>
        <span class="hi-data">${formatDateTime(new Date(d.criado_em))}</span>
      </span>
      <span class="hi-pontos">+${Number(d.ecodots) || 0}</span>
    </div>
  `).join("");
}

function categoryLabel(id) {
  return CATEGORY_META[id]?.name || id || "—";
}
function formatDateTime(date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---- Copiar token ---
// navigator.clipboard exige HTTPS; fora disso usamos o método antigo (funciona em http na rede local).
async function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(texto);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = texto;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, texto.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("copy falhou");
}
copyTokenBtn.addEventListener("click", async () => {
  if (!perfilAtual) return;
  try {
    await copiarTexto(perfilAtual.token);
    const original = copyTokenBtn.innerHTML;
    copyTokenBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
    setTimeout(() => { copyTokenBtn.innerHTML = original; }, 1500);
  } catch (e) {
    console.warn("Não foi possível copiar automaticamente:", e);
  }
});

// ---- Editar perfil ----------------------------------------------------
toggleEditBtn.addEventListener("click", () => {
  const abrindo = editPanel.classList.contains("hidden");
  editPanel.classList.toggle("hidden", !abrindo ? true : false);
  editPanel.classList.toggle("is-open");
  toggleEditIcon.classList.toggle("fa-chevron-down");
  toggleEditIcon.classList.toggle("fa-chevron-up");
});

saveProfileBtn.addEventListener("click", async () => {
  esconderAlerta(editAlert);
  editSuccess.classList.add("hidden");
  if (!db || !perfilAtual) return;

  const novoNome = editNome.value.trim();
  const novaSenha = editSenha.value;

  if (!novoNome) {
    mostrarAlerta(editAlert, "O nome não pode ficar vazio.");
    return;
  }

  saveProfileBtn.disabled = true;
  try {
    // Se o nome mudou, o e-mail interno de login também precisa mudar.
    if (novoNome !== perfilAtual.nome) {
      const novoEmail = nomeParaEmail(novoNome);
      const { error: emailError } = await db.auth.updateUser({ email: novoEmail, data: { nome: novoNome } });
      if (emailError) throw emailError;
    }

    if (novaSenha) {
      const { error: senhaError } = await db.auth.updateUser({ password: novaSenha });
      if (senhaError) throw senhaError;
    }

    await apiFetch("/api/perfis/me", {
      method: "PUT",
      body: { nome: novoNome },
      accessToken: await obterAccessToken(db),
    });

    perfilAtual.nome = novoNome;
    headerNome.textContent = novoNome;
    editSenha.value = "";
    editSuccess.textContent = "Cadastro atualizado com sucesso.";
    editSuccess.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    mostrarAlerta(editAlert, mensagemErroAuth(err));
  } finally {
    saveProfileBtn.disabled = false;
  }
});

regenTokenBtn.addEventListener("click", async () => {
  esconderAlerta(editAlert);
  editSuccess.classList.add("hidden");
  if (!db || !perfilAtual) return;

  const confirmado = confirm("Gerar um novo código vai invalidar o código atual. Continuar?");
  if (!confirmado) return;

  regenTokenBtn.disabled = true;
  try {
    const atualizado = await apiFetch("/api/perfis/me/token", {
      method: "POST",
      accessToken: await obterAccessToken(db),
    });
    perfilAtual.token = atualizado.token;
    tokenValue.textContent = atualizado.token;

    editSuccess.textContent = "Novo código gerado com sucesso.";
    editSuccess.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    mostrarAlerta(editAlert, mensagemErroAuth(err));
  } finally {
    regenTokenBtn.disabled = false;
  }
});

// ---- Inicialização: verifica se já existe sessão ativa -----------
async function init() {
  if (!db) {
    mostrarAlerta(authAlert, "Supabase não configurado — confira o config.js.");
    return;
  }
  try {
    const { data } = await db.auth.getSession();
    if (data?.session?.user) {
      await carregarDashboard();
    }
  } catch (err) {
    console.warn("Não foi possível restaurar a sessão:", err);
  }
}
init();
