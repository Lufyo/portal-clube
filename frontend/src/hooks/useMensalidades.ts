import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { Mensalidade } from "../types/mensalidade";

const mensagemDeErro = (e: unknown) =>
  e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.";

export function useMensalidades() {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  // Em .then (e não com await) para o estado só mudar quando a resposta
  // chegar: assim o useEffect abaixo não altera estado de forma síncrona.
  const carregar = useCallback(
    () =>
      api<Mensalidade[]>("/mensalidades")
        .then(setMensalidades)
        .catch((e) => setErro(mensagemDeErro(e)))
        .finally(() => setCarregando(false)),
    []
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Devolve true se o pagamento foi registrado
  async function pagar(id: string): Promise<boolean> {
    setPagandoId(id);
    setErro(null);
    try {
      await api(`/mensalidades/${id}/pagar`, { metodo: "POST" });
      await carregar(); // atualiza a lista com o novo status
      return true;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return false;
    } finally {
      setPagandoId(null);
    }
  }

  return { mensalidades, carregando, erro, pagandoId, pagar };
}