import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useMensalidades } from "../hooks/useMensalidades";
import type { Mensalidade } from "../types/mensalidade";
import {
  formatarData,
  formatarMes,
  formatarMoeda,
  hojeNoBrasil,
} from "../utils/formatadores";

// Define o texto e as cores da situação. O texto sempre aparece,
// assim a informação não depende só da cor (acessibilidade).
function situacao(mensalidade: Mensalidade) {
  if (mensalidade.status === "paga") {
    return { texto: "Paga", classes: "bg-green-100 text-green-800" };
  }
  if (mensalidade.vencimento < hojeNoBrasil()) {
    return { texto: "Em atraso", classes: "bg-red-100 text-red-800" };
  }
  return { texto: "Pendente", classes: "bg-yellow-100 text-yellow-900" };
}

export default function Mensalidades() {
  const { mensalidades, carregando, erro, pagandoId, pagar } = useMensalidades();
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function aoPagar(id: string) {
    setMensagem(null);
    if (await pagar(id)) {
      setMensagem("Pagamento registrado com sucesso!");
    }
  }

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">Mensalidades</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ambiente de demonstração: o pagamento é simulado e nada é cobrado de
          verdade.
        </p>

        {carregando && <p className="mt-6">Carregando mensalidades...</p>}

        {mensagem && (
          <p role="status" className="mt-6 rounded bg-green-50 p-3 text-green-800">
            {mensagem}
          </p>
        )}

        {erro && (
          <p role="alert" className="mt-6 rounded bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {!carregando && !erro && mensalidades.length === 0 && (
          <p className="mt-6">
            Você ainda não tem mensalidades.{" "}
            <Link to="/minha-area" className="font-semibold text-clube underline">
              Escolha um plano
            </Link>{" "}
            para começar.
          </p>
        )}

        <ul className="mt-8 space-y-4">
          {mensalidades.map((mensalidade) => {
            const { texto, classes } = situacao(mensalidade);

            return (
              <li
                key={mensalidade.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">
                    {formatarMes(mensalidade.referencia)}
                  </h2>
                  <span
                    className={`rounded px-2 py-1 text-sm font-semibold ${classes}`}
                  >
                    {texto}
                  </span>
                </div>

                <p className="mt-2 text-gray-700">
                  Plano {mensalidade.plano} ·{" "}
                  <strong>{formatarMoeda(mensalidade.valor)}</strong>
                </p>
                <p className="text-gray-700">
                  Vencimento: {formatarData(mensalidade.vencimento)}
                </p>

                {mensalidade.pagoEm ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Paga em{" "}
                    {new Date(mensalidade.pagoEm).toLocaleDateString("pt-BR")}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => aoPagar(mensalidade.id)}
                    // Bloqueia todos os botões enquanto um pagamento está em andamento
                    disabled={pagandoId !== null}
                    className="mt-4 rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {pagandoId === mensalidade.id
                      ? "Pagando..."
                      : `Pagar ${formatarMoeda(mensalidade.valor)}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </>
  );
}