import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { temPainel } from "../utils/permissoes";
import Logo from "./Logo";

// Links de navegação: apontam para as seções da landing (âncoras)
const links = [
  { texto: "Planos", href: "/#planos" },
  { texto: "Jogos", href: "/#jogos" },
  { texto: "Notícias", href: "/#noticias" },
  { texto: "Patrocinadores", href: "/#patrocinadores" },
];

// Estilo comum dos links do menu: sublinhado amarelo ao passar o mouse
const estiloLink =
  "border-b-2 border-transparent py-1 font-semibold hover:border-amarelo hover:text-amarelo";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario, sair } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-t-4 border-t-rubro border-b border-b-[#3a2f2a] bg-preto print:hidden">
      {/* Link de acessibilidade: só aparece ao navegar com o teclado (Tab) */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-amarelo focus:px-3 focus:py-2 focus:text-preto"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-3">
        <Link to="/" aria-label="Sport Club do Recife, página inicial">
          <Logo />
        </Link>

        {/* No celular: painel escondido até abrir o menu. Em lg: sempre visível,
            com a navegação no centro e a área do sócio à direita */}
        <div
          id="menu-principal"
          onClick={() => setMenuAberto(false)} // fecha o menu ao clicar em um link
          className={`${
            menuAberto ? "flex" : "hidden"
          } absolute left-0 top-full w-full flex-col gap-6 border-b-4 border-rubro bg-preto p-4 lg:static lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:border-0 lg:p-0`}
        >
          <nav aria-label="Principal">
            <ul className="flex flex-col gap-4 lg:flex-row lg:gap-7">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={estiloLink}>
                    {link.texto}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Área do sócio: muda conforme o login */}
          <ul className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            {usuario ? (
              <>
                {/* Só aparece para quem trabalha no clube (editor, gestor, admin) */}
                {temPainel(usuario.papel) && (
                  <li>
                    <Link to="/admin" className={estiloLink}>
                      Painel
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/minha-area" className={estiloLink}>
                    Minha área
                  </Link>
                </li>
                <li>
                  <Link to="/carteira" className={estiloLink}>
                    Carteira
                  </Link>
                </li>

              <li>
                <Link to="/meus-ingressos" className={estiloLink}>
                  Ingressos
                </Link>
              </li>

                <li>
                  <Link to="/mensalidades" className={estiloLink}>
                    Mensalidades
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => sair()}
                    className="botao-secundario [--botao-px:1rem] [--botao-py:0.5rem]"
                  >
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={estiloLink}>
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cadastro"
                    className="botao-primario [--botao-px:1.1rem] [--botao-py:0.5rem]"
                  >
                    Seja sócio
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Botão do menu: visível só no celular e no tablet */}
        <button
          type="button"
          className="ml-auto border-2 border-marfim px-3 py-1 text-xl lg:hidden"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <span aria-hidden="true">{menuAberto ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Barra de progresso da página (só aparece em navegadores com suporte) */}
      <div aria-hidden="true" className="barra-progresso" />
    </header>
  );
}