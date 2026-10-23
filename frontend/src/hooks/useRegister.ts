import { useState } from "react";
import { api, ApiError } from "../services/api";

export type DadosCadastro = {
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
  senha: string;
};

export function useRegister() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null); // erro geral
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Devolve true se o cadastro deu certo
  async function registrar(dados: DadosCadastro): Promise<boolean> {
    setCarregando(true);
    setErro(null);
    setErrosCampos({});

    try {
      await api("/auth/register", { metodo: "POST", corpo: dados });
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

  return { registrar, carregando, erro, errosCampos };
}