// ============================================================
//  Ecotronic Solutions — Configuração das telas
// ============================================================
// Supabase: usado SOMENTE para login/cadastro (nome + senha).
// Use sempre a "anon public key" (nunca a service_role).
const SUPABASE_URL = "https://bbzhxvecizasgfwroudq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiemh4dmVjaXphc2dmd3JvdWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjg5ODEsImV4cCI6MjEwMzk0NDk4MX0.J7WvUZevLvCjp_U1-fwsvbFw3qjvkEGcbr3N8AHYrMg";

// Endereço da API Java. Vazio = mesma origem das telas (funciona no celular, no PC
// e em produção, pois a API serve as telas). Só usa localhost se abrir o arquivo do disco (file://).
const API_URL = location.protocol.startsWith("http") ? "" : "http://localhost:8080";

// Deve ser igual a ecotronic.totem-key no application.properties do backend.
const TOTEM_API_KEY = "ecotronic-totem-dev-key";

// Identificador deste totem físico (único por totem).
const TOTEM_ID = "SOR-01";
