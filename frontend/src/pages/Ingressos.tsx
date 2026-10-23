import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useCompraIngressos } from "../hooks/useCompraIngressos";

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const controle =
  "w-full border-2 border-marfim-apagado bg-carvao px-3 py-2 text-marfim focus:border-amarelo";

export default function Ingressos() {
  const [params] = useSearchParams();
  const jogoId = params.get("jogo"); // vem do botão "Comprar ingresso"

  const {
    dados,
    carregando,
    erro,
    errosCampos,
    setorSelecionado,
    escolherSetor,
    quantidade,
    maxQuantidade,
    escolherQuantidade,
    total,
    comprando,
    compra,
    comprar,
  } = useCompraIngressos(jogoId);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    comprar();
  }

  // Erro geral só quando não há erros em campos específicos
  const mostrarErroGeral = erro && Object.keys(errosCampos).length === 0;

  // O time da casa sempre aparece primeiro, como nas tabelas de futebol
  const confronto = dados
    ? dados.jogo.mandante
      ? `Sport x ${dados.jogo.adversario}`
      : `${dados.jogo.adversario} x Sport`
    : "";

  const dataDoJogo = dados
    ? new Date(dados.jogo.data).toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : "";

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
        {/* Link comum (não Link do Router) para a página recarregar já na âncora */}
        <a href="/#jogos" className="text-marfim-apagado underline">
          Voltar aos jogos
        </a>

        <h1 className="titulo-display mt-4 text-5xl text-amarelo md:text-6xl">
          Ingressos
        </h1>

        {!jogoId && (
          <p className="mt-8">
            Escolha um jogo para comprar ingressos.{" "}
            <a href="/#jogos" className="font-semibold text-amarelo underline">
              Ver calendário de jogos
            </a>
          </p>
        )}

        {carregando && <p className="mt-8">Carregando jogo...</p>}

        {mostrarErroGeral && (
          <p role="alert" className="mt-8 bg-[#3a0b10] p-3 text-[#ff9aa2]">
            {erro}
          </p>
        )}

        {dados && (
          <>
            <section
              aria-labelledby="titulo-jogo"
              className="mt-8 border-l-8 border-rubro bg-carvao p-6"
            >
              <p className="text-sm font-semibold text-amarelo">
                {dados.jogo.competicao}
              </p>
              <h2 id="titulo-jogo" className="titulo-display mt-1 text-4xl">
                {confronto}
              </h2>
              <p className="mt-3 capitalize text-marfim-apagado">{dataDoJogo}</p>
              <p className="text-marfim-apagado">{dados.jogo.local}</p>
            </section>

            {!dados.jogo.vendaAberta && (
              <p className="mt-8 bg-[#3a2d00] p-3 text-amarelo">
                A venda de ingressos para este jogo foi encerrada.
              </p>
            )}

            {dados.jogo.vendaAberta && dados.limiteRestante === 0 && (
              <p className="mt-8 bg-[#3a2d00] p-3 text-amarelo">
                Você já comprou o máximo de 4 ingressos para este jogo.
              </p>
            )}

            {compra && (
              <div role="status" className="mt-8 bg-[#0f2a17] p-4 text-[#9fe3b0]">
                <p className="font-bold">
                  Compra realizada! {compra.ingressos.length}{" "}
                  {compra.ingressos.length === 1 ? "ingresso" : "ingressos"} ·{" "}
                  {moeda(compra.total)}
                </p>
                <p className="mt-2 text-sm">Códigos dos ingressos:</p>
                <ul className="mt-1 font-mono text-sm">
                  {compra.ingressos.map((ingresso) => (
                    <li key={ingresso.id}>{ingresso.codigo}</li>
                  ))}
                </ul>

            <Link to="/meus-ingressos" className="mt-4 inline-block font-bold underline">
              Ver meus ingressos
            </Link>

              </div>
            )}

            {dados.jogo.vendaAberta && dados.limiteRestante > 0 && (
              <form onSubmit={enviar} className="mt-8 space-y-8">
                {/* Desconto do plano ou convite para assinar um */}
                {dados.desconto > 0 ? (
                  <p className="text-marfim-apagado">
                    Você tem <strong className="text-amarelo">{dados.desconto}% de desconto</strong>{" "}
                    do seu plano de sócio.
                  </p>
                ) : (
                  <p className="text-marfim-apagado">
                    Sócios com plano pagam menos.{" "}
                    <a href="/#planos" className="font-semibold text-amarelo underline">
                      Conheça os planos
                    </a>
                  </p>
                )}

                {/* fieldset + legend agrupam as opções para leitores de tela */}
                <fieldset>
                  <legend className="titulo-display text-2xl">Escolha o setor</legend>

                  <div className="mt-4 space-y-3">
                    {dados.setores.map((setor) => {
                      const esgotado = setor.disponiveis === 0;
                      const selecionado = setorSelecionado?.id === setor.id;

                      return (
                        <label
                          key={setor.id}
                          className={`flex flex-wrap items-center justify-between gap-3 border-2 p-4 ${
                            selecionado ? "border-amarelo" : "border-marfim-apagado/40"
                          } ${esgotado ? "opacity-50" : "cursor-pointer"}`}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="setor"
                              value={setor.id}
                              checked={selecionado}
                              disabled={esgotado}
                              onChange={() => escolherSetor(setor.id)}
                            />
                            <span>
                              <span className="block font-bold">{setor.nome}</span>
                              <span className="text-sm text-marfim-apagado">
                                {esgotado
                                  ? "Esgotado"
                                  : `Restam ${setor.disponiveis.toLocaleString("pt-BR")}`}
                              </span>
                            </span>
                          </span>

                          <span className="text-right">
                            {dados.desconto > 0 && (
                              <span className="block text-sm text-marfim-apagado line-through">
                                {moeda(setor.preco)}
                              </span>
                            )}
                            <span className="numero-placar text-3xl text-amarelo">
                              {moeda(setor.precoComDesconto)}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {errosCampos.setorId && (
                    <p className="mt-2 text-sm text-[#ff9aa2]">{errosCampos.setorId}</p>
                  )}
                </fieldset>

                <div>
                  <label htmlFor="quantidade" className="block font-semibold">
                    Quantidade de ingressos
                  </label>
                  <select
                    id="quantidade"
                    value={quantidade}
                    disabled={maxQuantidade < 1}
                    onChange={(e) => escolherQuantidade(Number(e.target.value))}
                    className={`${controle} mt-1 max-w-40`}
                  >
                    {Array.from({ length: maxQuantidade }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-marfim-apagado">
                    Você ainda pode comprar até {dados.limiteRestante} para este jogo.
                  </p>
                  {errosCampos.quantidade && (
                    <p className="mt-1 text-sm text-[#ff9aa2]">{errosCampos.quantidade}</p>
                  )}
                </div>

                {/* Resumo e confirmação */}
                <div className="border-t-4 border-rubro pt-6">
                  <p className="text-marfim-apagado">Total</p>
                  <p className="numero-placar text-6xl text-amarelo">{moeda(total)}</p>

                  <button
                    type="submit"
                    disabled={comprando || quantidade < 1}
                    className="botao-primario mt-6"
                  >
                    {comprando
                      ? "Comprando..."
                      : `Comprar ${quantidade} ${quantidade === 1 ? "ingresso" : "ingressos"}`}
                  </button>

                  <p className="mt-4 text-sm text-marfim-apagado">
                    Ambiente de demonstração: o pagamento é simulado e nada é cobrado
                    de verdade.
                  </p>
                </div>
              </form>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}