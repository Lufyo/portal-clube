import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { Resumo } from "../types/admin";

export function useResumoAdmin() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<Resumo>("/admin/resumo")
      .then(setResumo)
      .catch((e) =>
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      );
  }, []);

  return { resumo, erro, carregando: !resumo && !erro };
}