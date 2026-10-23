import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Links de navegação: apontam para as seções da landing (âncoras)
const links = [
  { texto: "Planos", href: "/#planos" },
  { texto: "Jogos", href: "/#jogos" },
  { texto: "Notícias", href: "/#noticias" },
  { texto: "Patrocinadores", href: "/#patrocinadores" },
];

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario, sair } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-clube-escuro text-white print:hidden">
      {/* Link de acessibilidade: só aparece ao navegar com o teclado (Tab) */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-white focus:px-3 focus:py-2 focus:text-black"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold">
          Sport Club <span className="text-clube">do Recife</span>
        </Link>

        <nav aria-label="Principal">
          {/* No celular: lista escondida até abrir o menu. No desktop (md): sempre em linha */}
          <ul
            id="menu-principal"
            onClick={() => setMenuAberto(false)} // fecha o menu ao clicar em um link
            className={`${
              menuAberto ? "flex" : "hidden"
            } absolute left-0 top-full w-full flex-col gap-4 bg-clube-escuro p-4 md:static md:flex md:w-auto md:flex-row md:items-center md:p-0`}
          >
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-clube">
                  {link.texto}
                </a>
              </li>
            ))}

            {usuario ? (
              <>
              <li>
                <Link to="/minha-area" className="hover:text-clube">
                  Olá, {usuario.nome.split(" ")[0]}
                </Link>
              </li>
              <li>
                <Link to="/carteira" className="hover:text-clube">
                  Carteira
                </Link>
              </li>
              <li>
                <Link to="/mensalidades" className="hover:text-clube">
                  Mensalidades
                </Link>
              </li>
                <li>
                  <button
                    type="button"
                    onClick={sair}
                    className="hover:text-clube"
                  >
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="hover:text-clube">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cadastro"
                    className="inline-block rounded bg-clube px-4 py-2 font-semibold hover:bg-red-700"
                  >
                    Seja sócio
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Botão do menu: visível só no celular */}
        <button
          type="button"
          className="px-2 text-2xl md:hidden"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <span aria-hidden="true">{menuAberto ? "✕" : "☰"}</span>
        </button>
      </div>
    </header>
  );
}