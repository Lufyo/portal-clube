import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Campo from "../components/Campo";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useEditorNoticia } from "../hooks/useEditorNoticia";
import { categorias, tipos, type Categoria, type Tipo } from "../types/noticia";

const controle =
  "w-full border-2 border-marfim-apagado bg-carvao px-3 py-2 text-marfim focus:border-amarelo";

export default function AdminNoticiaForm() {
  const { id } = useParams(); // sem id = nova notícia
  const navigate = useNavigate();
  const {
    dados,
    atualizar,
    salvar,
    publicadaAtual,
    carregando,
    salvando,
    erro,
    errosCampos,
  } = useEditorNoticia(id);

  // Propriedades de acessibilidade comuns a todos os campos
  const props = (campo: string) => ({
    id: campo,
    name: campo,
    "aria-invalid": errosCampos[campo] ? true : undefined,
    "aria-describedby": errosCampos[campo]
      ? `${campo}-erro`
      : `${campo}-ajuda`,
  });

  async function enviar(evento: FormEvent, publicada: boolean) {
    evento.preventDefault();
    if (await salvar(publicada)) {
      navigate("/admin/noticias", {
        state: {
          mensagem: publicada
            ? publicadaAtual
              ? "Alterações salvas."
              : "Notícia publicada."
            : "Rascunho salvo.",
        },
      });
    }
  }

  // Erro geral só quando não há erros em campos específicos
  const mostrarErroGeral = erro && Object.keys(errosCampos).length === 0;

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/admin/noticias" className="text-marfim-apagado underline">
          Voltar para as notícias
        </Link>

        <h1 className="titulo-display mt-4 text-5xl text-amarelo md:text-6xl">
          {id ? "Editar notícia" : "Nova notícia"}
        </h1>

        {carregando && <p className="mt-8">Carregando notícia...</p>}

        {mostrarErroGeral && (
          <p role="alert" className="mt-8 bg-[#3a0b10] p-3 text-[#ff9aa2]">
            {erro}
          </p>
        )}

        {!carregando && (
          <form
            // Enter dentro de um campo salva como rascunho (ou mantém a situação atual)
            onSubmit={(e) => enviar(e, publicadaAtual)}
            className="mt-8 space-y-6"
          >
            <Campo id="titulo" rotulo="Título" erro={errosCampos.titulo}>
              <input
                {...props("titulo")}
                type="text"
                value={dados.titulo}
                maxLength={140}
                onChange={(e) => atualizar("titulo", e.target.value)}
                className={controle}
              />
            </Campo>

            <div className="grid gap-6 sm:grid-cols-2">
              <Campo id="categoria" rotulo="Categoria" erro={errosCampos.categoria}>
                <select
                  {...props("categoria")}
                  value={dados.categoria}
                  onChange={(e) =>
                    atualizar("categoria", e.target.value as Categoria)
                  }
                  className={controle}
                >
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id="tipo" rotulo="Tipo" erro={errosCampos.tipo}>
                <select
                  {...props("tipo")}
                  value={dados.tipo}
                  onChange={(e) => atualizar("tipo", e.target.value as Tipo)}
                  className={controle}
                >
                  {tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo
              id="resumo"
              rotulo="Resumo"
              erro={errosCampos.resumo}
              ajuda={`Aparece no cartão da notícia. ${dados.resumo.length} de 300 caracteres.`}
            >
              <textarea
                {...props("resumo")}
                rows={3}
                value={dados.resumo}
                maxLength={300}
                onChange={(e) => atualizar("resumo", e.target.value)}
                className={controle}
              />
            </Campo>

            <Campo
              id="conteudo"
              rotulo="Texto da notícia"
              erro={errosCampos.conteudo}
              ajuda="Separe os parágrafos com uma linha em branco."
            >
              <textarea
                {...props("conteudo")}
                rows={12}
                value={dados.conteudo}
                onChange={(e) => atualizar("conteudo", e.target.value)}
                className={controle}
              />
            </Campo>

            <div className="flex flex-col gap-4 sm:flex-row">
              {/* O botão principal muda conforme a situação atual da notícia */}
              <button
                type="button"
                disabled={salvando}
                onClick={(e) => enviar(e, true)}
                className="botao-primario"
              >
                {salvando
                  ? "Salvando..."
                  : publicadaAtual
                    ? "Salvar alterações"
                    : "Publicar"}
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={(e) => enviar(e, false)}
                className="botao-secundario"
              >
                {publicadaAtual ? "Voltar para rascunho" : "Salvar rascunho"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}