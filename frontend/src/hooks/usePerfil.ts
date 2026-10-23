import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { Perfil } from "../types/auth";

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Busca os dados do sócio logado (o token vai junto, via api.ts)
  const carregar = useCallback(() => {
    api<Perfil>("/auth/me")
      .then(setPerfil)
      .catch((e) =>
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      );
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Carregando = ainda não chegou nem o perfil nem um erro
  return { perfil, erro, carregando: !perfil && !erro, recarregar: carregar };
}