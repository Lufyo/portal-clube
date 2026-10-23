import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { NoticiaAdmin } from "../types/noticia";

const mensagemDeErro = (e: unknown) =>
  e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.";

export function useNoticiasAdmin() {
  const [noticias, setNoticias] = useState<NoticiaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setNoticias(await api<NoticiaAdmin[]>("/admin/noticias"));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Roda uma ação sobre uma notícia e recarrega a lista. Devolve true se deu certo.
  async function executar(id: string, acao: () => Promise<unknown>) {
    setOcupadoId(id);
    setErro(null);
    try {
      await acao();
      await carregar();
      return true;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return false;
    } finally {
      setOcupadoId(null);
    }
  }

  const alterarPublicacao = (id: string, publicada: boolean) =>
    executar(id, () =>
      api(`/admin/noticias/${id}/publicacao`, {
        metodo: "PATCH",
        corpo: { publicada },
      })
    );

  const excluir = (id: string) =>
    executar(id, () => api(`/admin/noticias/${id}`, { metodo: "DELETE" }));

  return { noticias, carregando, erro, ocupadoId, alterarPublicacao, excluir };
}