import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_KEY;

if (!url || !chave) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_KEY no arquivo .env");
}

// No servidor não guardamos sessão: cada requisição é independente
export const criarCliente = () =>
  createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// Cliente principal: usado para o banco e para a administração do Auth
export const supabase = criarCliente();