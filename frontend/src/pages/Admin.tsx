import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useResumoAdmin } from "../hooks/useResumoAdmin";
import type { Resumo } from "../types/admin";
import type { Papel } from "../types/auth";
import { podeAcessar } from "../utils/permissoes";

const nomesDosPapeis: Record<Papel, string> = {
  socio: "Sócio-torcedor",
  editor: "Editor de conteúdo",
  gestor: "Gestor de sócios",
  admin: "Administrador",
};

const indicadores: { chave: keyof Resumo; rotulo: string }[] = [
  { chave: "cadastros", rotulo: "Cadastros" },
  { chave: "sociosComPlano", rotulo: "Sócios com plano" },
  { chave: "mensalidadesPendentes", rotulo: "Mensalidades pendentes" },
  { chave: "noticiasPublicadas", rotulo: "Notícias publicadas" },
  { chave: "jogos", rotulo: "Jogos cadastrados" },
];

export default function Admin() {
  const { usuario } = useAuth();
  const { resumo, erro, carregando } = useResumoAdmin();

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="titulo-display text-5xl text-amarelo md:text-6xl">
          Painel
        </h1>
        <p className="mt-4 text-marfim-apagado">
          {usuario?.nome} · {usuario && nomesDosPapeis[usuario.papel]}
        </p>

        {carregando && <p className="mt-8">Carregando o resumo...</p>}

        {erro && (
          <p role="alert" className="mt-8 bg-[#3a0b10] p-3 text-[#ff9aa2]">
            {erro}
          </p>
        )}

        {resumo && (
          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {indicadores.map(({ chave, rotulo }) => (
              <div
                key={chave}
                className="border-l-8 border-rubro bg-carvao p-6"
              >
                <dt className="text-marfim-apagado">{rotulo}</dt>
                <dd className="numero-placar mt-1 text-6xl text-amarelo">
                  {resumo[chave]}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Cada atalho aparece só para quem tem permissão na API */}
        {usuario && podeAcessar(usuario.papel, ["editor"]) && (
          <section aria-labelledby="titulo-gestao" className="mt-14">
            <h2 id="titulo-gestao" className="titulo-display text-3xl">
              Gestão de conteúdo
            </h2>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link
                to="/admin/noticias"
                className="border-l-8 border-amarelo bg-carvao px-6 py-4 font-bold hover:bg-vinho"
              >
                Notícias
              </Link>
            </div>
          </section>
        )}

        <p className="mt-12 max-w-xl text-marfim-apagado">
          Em breve: gestão de jogos, sócios e usuários internos, de acordo com
          o seu perfil.
        </p>
      </main>
      <Footer />
    </>
  );
}