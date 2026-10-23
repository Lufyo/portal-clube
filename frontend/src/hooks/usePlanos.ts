import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { Plano } from "../types/plano";

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Busca os planos uma vez, quando o componente aparece na tela
  useEffect(() => {
    api<Plano[]>("/planos")
      .then(setPlanos)
      .catch((e) =>
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      )
      .finally(() => setCarregando(false));
  }, []);

  return { planos, carregando, erro };
}