import { useState } from "react";
import { useLista } from "../hooks/useLista";
import { categorias, type Categoria, type Noticia } from "../types/noticia";
import NoticiaCard from "./NoticiaCard";

// Opções do filtro: "Todas" + as 4 categorias
const opcoes = ["Todas", ...categorias] as const;

export default function NoticiasSection() {
  const { dados: noticias, carregando, erro } = useLista<Noticia>("/noticias");
  const [filtro, setFiltro] = useState<Categoria | "Todas">("Todas");

  const noticiasFiltradas =
    filtro === "Todas"
      ? noticias
      : noticias.filter((noticia) => noticia.categoria === filtro);

  return (
    <section
      id="noticias"
      aria-labelledby="titulo-noticias"
      className="scroll-mt-16 bg-gray-50 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="titulo-noticias" className="text-3xl font-bold">
          Últimas notícias
        </h2>

        {/* Botões do filtro; aria-pressed avisa o leitor de tela qual está ativo */}
        <div className="mt-6 flex flex-wrap gap-2">
          {opcoes.map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-pressed={filtro === opcao}
              onClick={() => setFiltro(opcao)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                filtro === opcao
                  ? "border-clube bg-clube text-white"
                  : "border-gray-300 bg-white hover:border-clube"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>

        {carregando && <p className="mt-8">Carregando notícias...</p>}

        {erro && (
          <p role="alert" className="mt-8 rounded bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {!carregando && !erro && noticiasFiltradas.length === 0 && (
          <p className="mt-8">Nenhuma notícia nesta categoria.</p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {noticiasFiltradas.map((noticia) => (
            <NoticiaCard key={noticia.id} noticia={noticia} />
          ))}
        </div>
      </div>
    </section>
  );
}