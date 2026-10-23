import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useNoticiasAdmin } from "../hooks/useNoticiasAdmin";
import type { NoticiaAdmin } from "../types/noticia";

const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default function AdminNoticias() {
  const { noticias, carregando, erro, ocupadoId, alterarPublicacao, excluir } =
    useNoticiasAdmin();
  const location = useLocation();

  // Mensagem enviada pelo formulário depois de salvar
  const [mensagem, setMensagem] = useState<string | null>(
    (location.state as { mensagem?: string } | null)?.mensagem ?? null
  );

  async function aoAlterarPublicacao(noticia: NoticiaAdmin) {
    setMensagem(null);
    if (await alterarPublicacao(noticia.id, !noticia.publicada)) {
      setMensagem(noticia.publicada ? "Notícia despublicada." : "Notícia publicada.");
    }
  }

  async function aoExcluir(noticia: NoticiaAdmin) {
    if (
      !window.confirm(
        `Excluir a notícia "${noticia.titulo}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    setMensagem(null);
    if (await excluir(noticia.id)) {
      setMensagem("Notícia excluída.");
    }
  }

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-12">
        <Link to="/admin" className="text-marfim-apagado underline">
          Voltar ao painel
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="titulo-display text-5xl text-amarelo md:text-6xl">
            Notícias
          </h1>
          <Link to="/admin/noticias/nova" className="botao-primario">
            Nova notícia
          </Link>
        </div>

        {mensagem && (
          <p
            role="status"
            className="mt-8 bg-[#0f2a17] p-3 text-[#9fe3b0]"
          >
            {mensagem}
          </p>
        )}
        {erro && (
          <p role="alert" className="mt-8 bg-[#3a0b10] p-3 text-[#ff9aa2]">
            {erro}
          </p>
        )}

        {carregando && <p className="mt-8">Carregando notícias...</p>}

        {!carregando && !erro && noticias.length === 0 && (
          <p className="mt-8">
            Nenhuma notícia cadastrada ainda. Crie a primeira em{" "}
            <strong>Nova notícia</strong>.
          </p>
        )}

        <ul className="mt-8 space-y-4">
          {noticias.map((noticia) => (
            <li
              key={noticia.id}
              className="border-l-8 border-rubro bg-carvao p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                {/* O texto da situação sempre aparece: a cor não é a única pista */}
                <span
                  className={`px-2 py-1 text-sm font-bold ${
                    noticia.publicada
                      ? "bg-[#0f2a17] text-[#9fe3b0]"
                      : "bg-[#3a2d00] text-amarelo"
                  }`}
                >
                  {noticia.publicada ? "Publicada" : "Rascunho"}
                </span>
                <span className="text-sm text-marfim-apagado">
                  {noticia.tipo} · {noticia.categoria}
                </span>
              </div>

              <h2 className="mt-2 text-xl font-bold">{noticia.titulo}</h2>
              <p className="mt-1 text-sm text-marfim-apagado">
                {noticia.publicada
                  ? `Publicada em ${formatarData(noticia.publicadaEm)}`
                  : `Criada em ${formatarData(noticia.criadoEm)}`}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/admin/noticias/${noticia.id}/editar`}
                  className="botao-secundario [--botao-px:1rem] [--botao-py:0.5rem]"
                >
                  Editar
                </Link>

                <button
                  type="button"
                  onClick={() => aoAlterarPublicacao(noticia)}
                  disabled={ocupadoId !== null}
                  className={`${
                    noticia.publicada ? "botao-secundario" : "botao-primario"
                  } [--botao-px:1rem] [--botao-py:0.5rem]`}
                >
                  {ocupadoId === noticia.id
                    ? "Salvando..."
                    : noticia.publicada
                      ? "Despublicar"
                      : "Publicar"}
                </button>

                <button
                  type="button"
                  onClick={() => aoExcluir(noticia)}
                  disabled={ocupadoId !== null}
                  className="border-2 border-[#ff9aa2] px-4 py-2 font-bold text-[#ff9aa2] hover:bg-[#ff9aa2] hover:text-preto disabled:opacity-55"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}