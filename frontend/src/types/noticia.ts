// "as const" transforma a lista em tipos fixos, evitando erros de digitação
export const categorias = [
  "Profissional masculino",
  "Profissional feminino",
  "Categorias de base",
  "Esportes olímpicos",
] as const;

export const tipos = ["Notícia", "Coletiva", "Comunicado", "Entrevista"] as const;

export type Categoria = (typeof categorias)[number];
export type Tipo = (typeof tipos)[number];

// Formato que o GET /api/noticias devolve (landing, só publicadas)
export type Noticia = {
  id: string;
  titulo: string;
  resumo: string;
  categoria: Categoria;
  tipo: Tipo;
  data: string; // data de publicação em formato ISO
};

// Formato das rotas do painel (GET /api/admin/noticias)
export type NoticiaAdmin = {
  id: string;
  titulo: string;
  resumo: string;
  categoria: Categoria;
  tipo: Tipo;
  publicada: boolean;
  publicadaEm: string;
  criadoEm: string;
  conteudo?: string; // só vem ao buscar uma notícia específica
};

// Formato do GET /api/noticias/:id (inclui o texto completo)
export type NoticiaCompleta = Noticia & {
  conteudo: string;
};