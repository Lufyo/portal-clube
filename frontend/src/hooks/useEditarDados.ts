import { useState } from "react";
import { api, ApiError } from "../services/api";
import type { Perfil } from "../types/auth";
import { useAuth } from "./useAuth";

export type DadosEditaveis = {
  nome: string;
  email: string;
  dataNascimento: string;
  senhaAtual?: string; // só quando o e-mail muda
};

export function useEditarDados() {
  const { atualizarUsuario } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Devolve true se os dados foram salvos
  async function salvar(dados: DadosEditaveis): Promise<boolean> {
    setCarregando(true);
    setErro(null);
    setErrosCampos({});

    try {
      const resposta = await api<{ perfil: Perfil }>("/auth/me", { metodo: "PATCH", corpo: dados });
      // O nome e o e-mail também aparecem em outras telas (ex.: painel)
      atualizarUsuario({ nome: resposta.perfil.nome, email: resposta.perfil.email });
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
      setCarregando(false);
    }
  }

  function limparErros() {
    setErro(null);
    setErrosCampos({});
  }

  return { salvar, carregando, erro, errosCampos, limparErros };
}
