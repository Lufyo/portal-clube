import { useLista } from "../hooks/useLista";
import type { Jogo } from "../types/jogo";
import JogoCard from "./JogoCard";

export default function JogosSection() {
  const { dados: jogos, carregando, erro } = useLista<Jogo>("/jogos");

  return (
    <section
      id="jogos"
      aria-labelledby="titulo-jogos"
      className="scroll-mt-16 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="titulo-jogos" className="text-3xl font-bold">
          Calendário de jogos
        </h2>
        <p className="mt-2 text-gray-700">
          Acompanhe os resultados e garanta seu ingresso.
        </p>

        {carregando && <p className="mt-10">Carregando jogos...</p>}

        {erro && (
          <p role="alert" className="mt-10 rounded bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {!carregando && !erro && jogos.length === 0 && (
          <p className="mt-10">Nenhum jogo cadastrado no momento.</p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {jogos.map((jogo) => (
            <JogoCard key={jogo.id} jogo={jogo} />
          ))}
        </div>
      </div>
    </section>
  );
}