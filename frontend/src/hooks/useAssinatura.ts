import { useState } from "react";
import { api, ApiError } from "../services/api";

export function useAssinatura() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Roda uma ação e cuida do carregando e do erro. Devolve true se deu certo.
  async function executar(acao: () => Promise<unknown>): Promise<boolean> {
    setCarregando(true);
    setErro(null);
    try {
      await acao();
      return true;
    } catch (e) {
      setErro(
        e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente."
      );
      return false;
    } finally {
      setCarregando(false);
    }
  }

  const contratar = (planoId: string) =>
    executar(() => api("/assinatura", { metodo: "POST", corpo: { planoId } }));

  const cancelar = () => executar(() => api("/assinatura", { metodo: "DELETE" }));

  return { contratar, cancelar, carregando, erro };
}