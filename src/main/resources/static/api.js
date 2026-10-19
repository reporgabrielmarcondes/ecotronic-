// ============================================================
//  Ecotronic Solutions — Cliente da API Java
// ============================================================
// Carregado depois de config.js. Todas as telas usam apiFetch() para
// falar com o backend; o Supabase fica restrito ao login.

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(path, { method = "GET", body, accessToken, totem = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (totem) headers["X-Totem-Key"] = TOTEM_API_KEY;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, "Servidor indisponível. Verifique se a API Java está rodando.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.erro || `Erro ${res.status}`);
  return data;
}

// Token de acesso da sessão atual do Supabase (renovado automaticamente pelo SDK).
async function obterAccessToken(supabaseClient) {
  const { data } = await supabaseClient.auth.getSession();
  return data?.session?.access_token || null;
}
