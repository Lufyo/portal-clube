import { Link } from "react-router-dom";
import CarteiraSocio from "../components/CarteiraSocio";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { usePerfil } from "../hooks/usePerfil";

// "print:hidden" esconde o elemento na impressão: só o cartão sai no papel ou PDF
export default function Carteira() {
  const { perfil, erro, carregando } = usePerfil();

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold print:hidden">Minha carteira</h1>

        {carregando && <p className="mt-6">Carregando sua carteira...</p>}

        {erro && (
          <p role="alert" className="mt-6 rounded bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {/* Sem plano: não há carteira para emitir */}
        {perfil && !perfil.plano && (
          <p className="mt-6">
            Você precisa de um plano de sócio para emitir sua carteira.{" "}
            <Link to="/minha-area" className="font-semibold text-clube underline">
              Escolher um plano
            </Link>
          </p>
        )}

        {perfil && perfil.plano && (
          <>
            <div className="mt-8">
              <CarteiraSocio
                nome={perfil.nome}
                cpf={perfil.cpf}
                numeroSocio={perfil.numeroSocio}
                plano={perfil.plano.nome}
              />
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="mt-6 rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 print:hidden"
            >
              Imprimir / salvar PDF
            </button>
            <p className="mt-4 text-sm text-gray-600 print:hidden">
              Dica: na janela de impressão, escolha "Salvar como PDF" para
              guardar a carteira no computador ou no celular.
            </p>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}