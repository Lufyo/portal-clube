import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Papel } from "../types/auth";
import { podeAcessar } from "../utils/permissoes";

type Props = {
  papeis?: Papel[]; // perfis permitidos; se omitido, basta estar logado
};

export default function RotaProtegida({ papeis }: Props) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return <p className="p-8">Carregando...</p>;
  }
  if (!usuario) {
    // Guarda de onde veio, para voltar depois do login
    return (
      <Navigate
        to="/login"
        replace
        state={{ de: location.pathname + location.search }}
      />
    );
  }
  // Logado, mas sem permissão: volta para a área do sócio.
  // A decisão real de segurança é sempre da API (middleware exigirPapel).
  if (papeis && !podeAcessar(usuario.papel, papeis)) {
    return <Navigate to="/minha-area" replace />;
  }
  return <Outlet />;
}