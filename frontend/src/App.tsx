import { Route, Routes } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import Cadastro from "./pages/Cadastro";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MinhaArea from "./pages/MinhaArea";
import Carteira from "./pages/Carteira";
import Mensalidades from "./pages/Mensalidades";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/login" element={<Login />} />

      {/* Tudo dentro desta rota exige login */}
      <Route element={<RotaProtegida />}>
        <Route path="/minha-area" element={<MinhaArea />} />
        <Route path="/carteira" element={<Carteira />} />
        <Route path="/mensalidades" element={<Mensalidades />} />
      </Route>
    </Routes>
  );
}