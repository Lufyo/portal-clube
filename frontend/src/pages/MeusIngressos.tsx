import Footer from "../components/Footer";
import Header from "../components/Header";
import IngressoCard from "../components/IngressoCard";
import { useMeusIngressos } from "../hooks/useMeusIngressos";

export default function MeusIngressos() {
  const { ingressos, carregando, erro } = useMeusIngressos();

  const agora = new Date();
  const porData = (a: { jogo: { data: string } }, b: { jogo: { data: string } }) =>
    new Date(a.jogo.data).getTime() - new Date(b.jogo.data).getTime();

  // Próximos: do jogo mais perto para o mais longe. Anteriores: do mais recente.
  const proximos = ingressos
    .filter((i) => new Date(i.jogo.data) > agora)
    .sort(porData);
  const anteriores = ingressos
    .filter((i) => new Date(i.jogo.data) <= agora)
    .sort((a, b) => porData(b, a));

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
          <h1 className="titulo-display text-5xl text-amarelo md:text-6xl">
            Meus ingressos
          </h1>
          {/* Link comum (não Link do Router) para a página recarregar já na âncora */}
          <a href="/#jogos" className="botao-primario">
            Comprar ingressos
          </a>
        </div>

        {carregando && <p className="mt-8">Carregando seus ingressos...</p>}

        {erro && (
          <p role="alert" className="mt-8 bg-[#3a0b10] p-3 text-[#ff9aa2]">
            {erro}
          </p>
        )}

        {!carregando && !erro && ingressos.length === 0 && (
          <p className="mt-8">
            Você ainda não comprou ingressos. Veja o{" "}
            <a href="/#jogos" className="font-semibold text-amarelo underline">
              calendário de jogos
            </a>
            .
          </p>
        )}

        {proximos.length > 0 && (
          <section aria-labelledby="titulo-proximos" className="mt-10">
            <h2 id="titulo-proximos" className="titulo-display text-3xl">
              Próximos jogos
            </h2>
            <ul className="mt-4 space-y-4">
              {proximos.map((ingresso) => (
                <li key={ingresso.id}>
                  <IngressoCard ingresso={ingresso} passado={false} />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => window.print()}
              className="botao-secundario mt-6 print:hidden"
            >
              Imprimir / salvar PDF
            </button>
          </section>
        )}

        {anteriores.length > 0 && (
          <section aria-labelledby="titulo-anteriores" className="mt-12 print:hidden">
            <h2 id="titulo-anteriores" className="titulo-display text-3xl">
              Jogos anteriores
            </h2>
            <ul className="mt-4 space-y-4">
              {anteriores.map((ingresso) => (
                <li key={ingresso.id}>
                  <IngressoCard ingresso={ingresso} passado />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}