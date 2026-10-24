import { useState } from "react";
import { api, ApiError } from "../services/api";
import { baixarJson } from "../utils/baixarArquivo";

const mensagemDeErro = (e: unknown) =>
  e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.";

// Direitos da LGPD na área do sócio: baixar os próprios dados e excluir a conta
export function usePrivacidade() {
  const [baixando, setBaixando] = useState(false);
  const [erroDownload, setErroDownload] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Devolve true se o arquivo foi baixado
  async function baixarDados(): Promise<boolean> {
    setBaixando(true);
    setErroDownload(null);
    try {
      baixarJson("meus-dados-portal-sport-club.json", await api("/auth/me/dados"));
      return true;
    } catch (e) {
      setErroDownload(mensagemDeErro(e));
      return false;
    } finally {
      setBaixando(false);
    }
  }

  // Devolve true se a conta foi excluída
  async function excluirConta(senhaAtual: string): Promise<boolean> {
    setExcluindo(true);
    setErroExclusao(null);
    setErrosCampos({});
    try {
      await api("/auth/me", { metodo: "DELETE", corpo: { senhaAtual } });
      return true;
    } catch (e) {
      setErroExclusao(mensagemDeErro(e));
      setErrosCampos(e instanceof ApiError ? (e.campos ?? {}) : {});
      return false;
    } finally {
      setExcluindo(false);
    }
  }

  function limparErrosDaExclusao() {
    setErroExclusao(null);
    setErrosCampos({});
  }

  return {
    baixarDados,
    baixando,
    erroDownload,
    excluirConta,
    excluindo,
    erroExclusao,
    errosCampos,
    limparErrosDaExclusao,
  };
}
