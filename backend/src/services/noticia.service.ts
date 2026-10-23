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

export async function buscarNoticiaPublica(id: string) {
  const { data, error } = await supabase
    .from("noticias")
    .select("id, titulo, resumo, conteudo, categoria, tipo, publicada_em")
    .eq("id", id)
    .eq("publicada", true) // rascunho = "não encontrada" para o público
    .maybeSingle();

  // 22P02 = o id não tem formato de UUID; tratamos como "não encontrada"
  if (error && error.code !== "22P02") {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar a notícia", 500);
  }
  if (!data) {
    throw new ErroDeNegocio("Notícia não encontrada", 404);
  }

  return {
    id: data.id,
    titulo: data.titulo,
    resumo: data.resumo,
    conteudo: data.conteudo,
    categoria: data.categoria,
    tipo: data.tipo,
    data: data.publicada_em,
  };
}