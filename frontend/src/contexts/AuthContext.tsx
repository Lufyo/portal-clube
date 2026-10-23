import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, guardarToken, lerToken, removerToken } from "../services/api";
import type { RespostaLogin, Usuario } from "../types/auth";

type AuthContextData = {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto conferimos se já existe um login salvo
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Só "carrega" se houver token salvo; sem token, já sabemos que não há login
  const [carregando, setCarregando] = useState(() => lerToken() !== null);

  // Ao abrir o site: se há token salvo, pergunta à API quem é o usuário
  useEffect(() => {
    if (!lerToken()) return;

    api<Usuario>("/auth/me")
      .then(setUsuario)
      .catch(() => removerToken()) // token expirado ou inválido: descarta
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email: string, senha: string) {
    const resposta = await api<RespostaLogin>("/auth/login", {
      metodo: "POST",
      corpo: { email, senha },
    });
    guardarToken(resposta.token);
    setUsuario(resposta.usuario);
  }

  function sair() {
    removerToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto: const { usuario, entrar, sair } = useAuth();
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  }
  return contexto;
}