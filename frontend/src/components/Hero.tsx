import { Link } from "react-router-dom";

export default function Hero() {
  return (
    // aria-labelledby liga a seção ao título, ajudando leitores de tela
    <section
      aria-labelledby="titulo-hero"
      className="bg-linear-to-br from-clube-escuro to-clube text-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-32">
        {/* Único h1 da página: importante para acessibilidade e SEO */}
        <h1
          id="titulo-hero"
          className="max-w-3xl text-4xl font-extrabold md:text-6xl"
        >
          Seja sócio e viva o Leão de perto
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-100 md:text-xl">
          Notícias, jogos, ingressos e a sua carteira de sócio-torcedor em um
          só lugar.
        </p>

        {/* Botões empilhados no celular e lado a lado a partir de sm */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/cadastro"
            className="rounded bg-white px-6 py-3 text-center font-bold text-clube-escuro hover:bg-gray-200"
          >
            Seja sócio
          </Link>
          <Link
            to="/login"
            className="rounded border-2 border-white px-6 py-3 text-center font-bold hover:bg-white hover:text-clube-escuro"
          >
            Já sou sócio
          </Link>
        </div>
      </div>
    </section>
  );
}