import { Route, Routes } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import Admin from "./pages/Admin";
import AdminNoticiaForm from "./pages/AdminNoticiaForm";
import AdminNoticias from "./pages/AdminNoticias";
import Cadastro from "./pages/Cadastro";
import Carteira from "./pages/Carteira";
import Home from "./pages/Home";
import Ingressos from "./pages/Ingressos";
import Login from "./pages/Login";
import Mensalidades from "./pages/Mensalidades";
import MinhaArea from "./pages/MinhaArea";
import NaoEncontrada from "./pages/NaoEncontrada";
import NoticiaDetalhe from "./pages/NoticiaDetalhe";
import MeusIngressos from "./pages/MeusIngressos";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/noticias/:id" element={<NoticiaDetalhe />} />

      {/* Área do sócio: basta estar logado */}
      <Route element={<RotaProtegida />}>
        <Route path="/minha-area" element={<MinhaArea />} />
        <Route path="/carteira" element={<Carteira />} />
        <Route path="/mensalidades" element={<Mensalidades />} />
        <Route path="/ingressos" element={<Ingressos />} />
        <Route path="/meus-ingressos" element={<MeusIngressos />} />
      </Route>

      {/* Painel: funcionários (o admin sempre entra) */}
      <Route element={<RotaProtegida papeis={["editor", "gestor"]} />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Gestão de notícias: só editor (e admin) */}
      <Route element={<RotaProtegida papeis={["editor"]} />}>
        <Route path="/admin/noticias" element={<AdminNoticias />} />
        <Route path="/admin/noticias/nova" element={<AdminNoticiaForm />} />
        <Route path="/admin/noticias/:id/editar" element={<AdminNoticiaForm />} />
      </Route>

      {/* Qualquer endereço que não exista */}
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}