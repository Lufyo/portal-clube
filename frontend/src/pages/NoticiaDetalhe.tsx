import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useNoticia } from "../hooks/useNoticia";

export default function NoticiaDetalhe() {
  const { id } = useParams();
  const { noticia, erro, carregando } = useNoticia(id);

  // O título da aba do navegador passa a ser o da notícia
  useEffect(() => {
    if (!noticia) return;
    const tituloAnterior = document.title;
    document.title = `${noticia.titulo} | Sport Club do Recife`;
    return () => {
      document.title = tituloAnterior;
    };
  }, [noticia]);

  // Uma linha em branco separa os parágrafos
  const paragrafos = noticia?.conteudo.split(/\n\s*\n/) ?? [];

  const dataFormatada = noticia
    ? new Date(noticia.data).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      })
    : "";

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
        {/* Link comum (não Link do Router) para a página recarregar já na âncora */}
        <a href="/#noticias" className="text-marfim-apagado underline">
          Voltar às notícias
        </a>

        {carregando && <p className="mt-8">Carregando notícia...</p>}

        {erro && (
          <p role="alert" className="mt-8 bg-[#3a0b10] p-3 text-[#ff9aa2]">
            {erro}
          </p>
        )}

        {noticia && (
          <article className="mt-8">
            <p className="font-semibold text-amarelo">
              {noticia.tipo} · {noticia.categoria}
            </p>

            <h1 className="titulo-display mt-3 text-5xl md:text-6xl">
              {noticia.titulo}
            </h1>

            <p className="mt-4 text-sm text-marfim-apagado">
              <time dateTime={noticia.data}>{dataFormatada}</time>
            </p>

            {/* Resumo como abertura do texto */}
            <p className="mt-8 border-l-8 border-rubro pl-4 text-xl text-marfim">
              {noticia.resumo}
            </p>

            {/* Linhas de até ~65 caracteres, mais confortáveis de ler */}
            <div className="mt-8 max-w-[65ch] space-y-5 text-lg leading-relaxed">
              {paragrafos.map((paragrafo, indice) => (
                <p key={indice} className="whitespace-pre-line">
                  {paragrafo}
                </p>
              ))}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </>
  );
}