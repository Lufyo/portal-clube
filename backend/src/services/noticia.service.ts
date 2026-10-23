import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";

export async function listarNoticias() {
  const { data, error } = await supabase
    .from("noticias")
    .select("id, titulo, resumo, categoria, tipo, publicada_em")
    .eq("publicada", true) // rascunhos não aparecem no portal
    .order("publicada_em", { ascending: false }) // mais recentes primeiro
    .limit(12);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar as notícias", 500);
  }

  return data.map((noticia) => ({
    id: noticia.id,
    titulo: noticia.titulo,
    resumo: noticia.resumo,
    categoria: noticia.categoria,
    tipo: noticia.tipo,
    data: noticia.publicada_em,
  }));
}