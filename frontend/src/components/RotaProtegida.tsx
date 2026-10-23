import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Envolve páginas que exigem login. Se não houver usuário, manda para /login.
export default function RotaProtegida() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <p className="p-8">Carregando...</p>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // mostra a página protegida
}