import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function NaoEncontrada() {
  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="titulo-display text-6xl text-amarelo md:text-8xl">
          Página não encontrada
        </h1>
        <p className="mt-6 text-lg text-marfim-apagado">
          O endereço que você abriu não existe ou foi movido.
        </p>
        <Link to="/" className="botao-primario mt-8">
          Voltar ao início
        </Link>
      </main>
      <Footer />
    </>
  );
}