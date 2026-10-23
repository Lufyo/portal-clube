import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/api";

export function useLogin() {
  const { entrar } = useAuth(); // vem do AuthContext (Etapa 12)
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Devolve true se o login deu certo
  async function login(email: string, senha: string): Promise<boolean> {
    setCarregando(true);
    setErro(null);
    setErrosCampos({});

    try {
      await entrar(email, senha);
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

  return { login, carregando, erro, errosCampos };
}