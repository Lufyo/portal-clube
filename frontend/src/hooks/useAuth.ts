import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// Hook para usar o contexto: const { usuario, entrar, sair } = useAuth();
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  }
  return contexto;
}
