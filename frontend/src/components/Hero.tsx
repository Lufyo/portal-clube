import { Link } from "react-router-dom";

export default function Hero() {
  return (
    // aria-labelledby liga a seção ao título, ajudando leitores de tela
    <section
      aria-labelledby="titulo-hero"
      className="relative overflow-hidden border-b-8 border-rubro bg-preto"
    >
      {/* Faixas rubro-negras, só decoração. O bloco externo faz o parallax;
          o interno entra deslizando uma vez ao abrir a página.
          O -top-40 dá folga para o parallax não deixar um vão no topo. */}
      <div
        aria-hidden="true"
        className="parallax-faixas absolute -top-40 right-0 bottom-0 hidden w-24 md:block xl:w-1/4"
      >
        <div className="faixas faixas-entrada h-full w-full" />
      </div>

      <div className="parallax-texto relative mx-auto max-w-6xl px-4 py-20 md:py-32">
        {/* Único h1 da página: importante para acessibilidade e SEO */}
        <h1
          id="titulo-hero"
          className="titulo-display max-w-3xl text-6xl text-amarelo sm:text-7xl md:text-8xl lg:text-9xl"
        >
          Seja sócio e viva o Leão de perto
        </h1>

        <p className="mt-8 max-w-xl text-lg text-marfim md:text-xl">
          Notícias, jogos, ingressos e a sua carteira de sócio-torcedor em um
          só lugar.
        </p>

        {/* Botões empilhados no celular e lado a lado a partir de sm */}
        <div className="mt-10 flex flex-col gap-5 sm:flex-row">
          <Link to="/cadastro" className="botao-primario text-center">
            Seja sócio
          </Link>
          <Link to="/login" className="botao-secundario text-center">
            Já sou sócio
          </Link>
        </div>
      </div>
    </section>
  );
}