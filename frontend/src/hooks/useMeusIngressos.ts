import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { MeuIngresso } from "../types/ingresso";

export function useMeusIngressos() {
  const [ingressos, setIngressos] = useState<MeuIngresso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<MeuIngresso[]>("/ingressos")
      .then(setIngressos)
      .catch((e) =>
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      )
      .finally(() => setCarregando(false));
  }, []);

  return { ingressos, carregando, erro };
}