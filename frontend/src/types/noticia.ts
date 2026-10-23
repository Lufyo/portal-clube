// "as const" transforma a lista em tipos fixos, evitando erros de digitação
export const categorias = [
  "Profissional masculino",
  "Profissional feminino",
  "Categorias de base",
  "Esportes olímpicos",
] as const;

export type Categoria = (typeof categorias)[number];

// Formato que o GET /api/noticias devolve
export type Noticia = {
  id: string;
  titulo: string;
  resumo: string;
  categoria: Categoria;
  tipo: "Notícia" | "Coletiva" | "Comunicado" | "Entrevista";
  data: string; // data de publicação em formato ISO
};