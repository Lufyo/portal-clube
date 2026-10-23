import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";
import type { NoticiaInput } from "../schemas/noticia.schema";

type Linha = {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  tipo: string;
  publicada: boolean;
  publicada_em: string;
  criado_em: string;
  conteudo?: string;
};

// Campos que podem ser alterados numa atualização
type Alteracoes = Partial<NoticiaInput> & { publicada_em?: string };

const COLUNAS_LISTA =
  "id, titulo, resumo, categoria, tipo, publicada, publicada_em, criado_em";

// Converte as colunas do banco para o formato da API (camelCase)
function paraApi(n: Linha) {
  return {
    id: n.id,
    titulo: n.titulo,
    resumo: n.resumo,
    categoria: n.categoria,
    tipo: n.tipo,
    publicada: n.publicada,
    publicadaEm: n.publicada_em,
    criadoEm: n.criado_em,
    ...(n.conteudo !== undefined && { conteudo: n.conteudo }),
  };
}

const naoEncontrada = () => new ErroDeNegocio("Notícia não encontrada", 404);

export async function listarNoticiasAdmin() {
  const { data, error } = await supabase
    .from("noticias")
    .select(COLUNAS_LISTA)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar as notícias", 500);
  }
  return data.map(paraApi);
}

export async function buscarNoticiaAdmin(id: string) {
  const { data, error } = await supabase
    .from("noticias")
    .select(`${COLUNAS_LISTA}, conteudo`)
    .eq("id", id)
    .maybeSingle();

  // 22P02 = o id não tem formato de UUID; tratamos como "não encontrada"
  if (error && error.code !== "22P02") {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar a notícia", 500);
  }
  if (!data) throw naoEncontrada();
  return paraApi(data);
}

export async function criarNoticia(dados: NoticiaInput) {
  const { data, error } = await supabase
    .from("noticias")
    // Se já nasce publicada, a data de publicação é agora.
    // Rascunho usa o valor padrão do banco e é atualizado ao publicar.
    .insert({
      ...dados,
      ...(dados.publicada && { publicada_em: new Date().toISOString() }),
    })
    .select(`${COLUNAS_LISTA}, conteudo`)
    .single();

  if (error || !data) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível criar a notícia", 500);
  }
  return paraApi(data);
}

async function atualizar(id: string, alteracoes: Alteracoes) {
  const existente = await buscarNoticiaAdmin(id); // 404 se não existir

  // A data de publicação é gravada quando o rascunho vira publicada
  if (alteracoes.publicada === true && !existente.publicada) {
    alteracoes.publicada_em = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("noticias")
    .update(alteracoes)
    .eq("id", id)
    .select(`${COLUNAS_LISTA}, conteudo`)
    .single();

  if (error || !data) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível salvar a notícia", 500);
  }
  return paraApi(data);
}

export const atualizarNoticia = (id: string, dados: NoticiaInput) =>
  atualizar(id, dados);

export const alterarPublicacao = (id: string, publicada: boolean) =>
  atualizar(id, { publicada });

export async function excluirNoticia(id: string) {
  const { data, error } = await supabase
    .from("noticias")
    .delete()
    .eq("id", id)
    .select("id");

  if (error && error.code !== "22P02") {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível excluir a notícia", 500);
  }
  // Nenhuma linha apagada: o id não existia
  if (!data || data.length === 0) throw naoEncontrada();
}