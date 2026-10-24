import { createContext } from "react";
import type { Usuario } from "../types/auth";

// O contexto fica separado do AuthProvider (componente) e do useAuth (hook):
// arquivo de componente só exporta componentes, senão o Fast Refresh do Vite
// recarrega a página inteira a cada alteração.
export type AuthContextData = {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto conferimos se já existe um login salvo
  entrar: (email: string, senha: string) => Promise<void>;
  // "aviso" aparece na tela de login (ex.: por que a sessão foi encerrada)
  sair: (aviso?: string) => void;
  aviso: string | null;
  // Depois de editar os dados, o nome e o e-mail novos valem para todas as telas
  atualizarUsuario: (dados: Pick<Usuario, "nome" | "email">) => void;
};

export const AuthContext = createContext<AuthContextData | null>(null);
