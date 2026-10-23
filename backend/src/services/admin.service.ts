import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";

// Números exibidos na página inicial do painel.
// head: true devolve só a contagem, sem trazer as linhas.
export async function obterResumo() {
  const consultas = await Promise.all([
    supabase.from("perfis").select("*", { count: "exact", head: true }),
    supabase
      .from("perfis")
      .select("*", { count: "exact", head: true })
      .not("plano_id", "is", null),
    supabase
      .from("mensalidades")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("noticias")
      .select("*", { count: "exact", head: true })
      .eq("publicada", true),
    supabase.from("jogos").select("*", { count: "exact", head: true }),
  ]);

  if (consultas.some((consulta) => consulta.error)) {
    console.error(consultas.map((consulta) => consulta.error));
    throw new ErroDeNegocio("Não foi possível carregar o resumo", 500);
  }

  const [cadastros, sociosComPlano, mensalidadesPendentes, noticiasPublicadas, jogos] =
    consultas.map((consulta) => consulta.count ?? 0);

  return { cadastros, sociosComPlano, mensalidadesPendentes, noticiasPublicadas, jogos };
}