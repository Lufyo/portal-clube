import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { NoticiaCompleta } from "../types/noticia";

export function useNoticia(id?: string) {
  const [noticia, setNoticia] = useState<NoticiaCompleta | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<NoticiaCompleta>(`/noticias/${id}`)
      .then(setNoticia)
      .catch((e) =>
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      );
  }, [id]);

  // Carregando = ainda não chegou nem a notícia nem um erro
  return { noticia, erro, carregando: !noticia && !erro };
}