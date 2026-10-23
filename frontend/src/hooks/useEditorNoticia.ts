import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import {
  categorias,
  tipos,
  type Categoria,
  type NoticiaAdmin,
  type Tipo,
} from "../types/noticia";

export type DadosNoticia = {
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: Categoria;
  tipo: Tipo;
};

const vazio: DadosNoticia = {
  titulo: "",
  resumo: "",
  conteudo: "",
  categoria: categorias[0],
  tipo: tipos[0],
};

export function useEditorNoticia(id?: string) {
  const [dados, setDados] = useState<DadosNoticia>(vazio);
  const [publicadaAtual, setPublicadaAtual] = useState(false);
  const [carregando, setCarregando] = useState(id !== undefined);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Ao editar, carrega a notícia existente
  useEffect(() => {
    if (!id) return;
    api<NoticiaAdmin>(`/admin/noticias/${id}`)
      .then((n) => {
        setDados({
          titulo: n.titulo,
          resumo: n.resumo,
          conteudo: n.conteudo ?? "",
          categoria: n.categoria,
          tipo: n.tipo,
        });
        setPublicadaAtual(n.publicada);
      })
      .catch((e) =>
        setErro(e instanceof ApiError ? e.message : "Erro inesperado.")
      )
      .finally(() => setCarregando(false));
  }, [id]);

  // Atualiza um único campo, mantendo os outros
  function atualizar<K extends keyof DadosNoticia>(campo: K, valor: DadosNoticia[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  // Cria ou edita. "publicada" define a situação final. Devolve true se deu certo.
  async function salvar(publicada: boolean): Promise<boolean> {
    setSalvando(true);
    setErro(null);
    setErrosCampos({});
    try {
      await api(id ? `/admin/noticias/${id}` : "/admin/noticias", {
        metodo: id ? "PUT" : "POST",
        corpo: { ...dados, publicada },
      });
      return true;
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro inesperado. Tente novamente.");
      }
      return false;
    } finally {
      setSalvando(false);
    }
  }

  return {
    dados,
    atualizar,
    salvar,
    publicadaAtual,
    carregando,
    salvando,
    erro,
    errosCampos,
  };
}