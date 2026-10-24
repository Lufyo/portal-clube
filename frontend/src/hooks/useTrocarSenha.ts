import { useState } from "react";
import { api, ApiError, guardarToken } from "../services/api";

export function useTrocarSenha() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Devolve "trocada", "entrar-de-novo" (trocada, mas sem token novo) ou "erro"
  async function trocar(
    senhaAtual: string,
    novaSenha: string
  ): Promise<"trocada" | "entrar-de-novo" | "erro"> {
    setCarregando(true);
    setErro(null);
    setErrosCampos({});

    try {
      const resposta = await api<{ token: string | null }>("/auth/senha", {
        metodo: "PUT",
        corpo: { senhaAtual, novaSenha },
      });
      // Trocar a senha encerra as sessões da conta: o token antigo deixa de
      // valer e a API devolve um novo para continuar logado
      if (!resposta.token) return "entrar-de-novo";
      guardarToken(resposta.token);
      return "trocada";
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro inesperado. Tente novamente.");
      }
      return "erro";
    } finally {
      setCarregando(false);
    }
  }

  // Erros conferidos na própria tela (ex.: confirmação diferente da nova senha)
  function mostrarErroDoCampo(campo: string, mensagem: string) {
    setErro(null);
    setErrosCampos({ [campo]: mensagem });
  }

  function limparErros() {
    setErro(null);
    setErrosCampos({});
  }

  return { trocar, carregando, erro, errosCampos, mostrarErroDoCampo, limparErros };
}
