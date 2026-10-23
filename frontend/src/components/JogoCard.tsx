import { Link } from "react-router-dom";
import type { Jogo } from "../types/jogo";

type Props = {
  jogo: Jogo;
};

export default function JogoCard({ jogo }: Props) {
  const data = new Date(jogo.data);
  const dataFormatada = data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // O time da casa sempre aparece primeiro, como nas tabelas de futebol
  const confronto = jogo.mandante
    ? `Sport x ${jogo.adversario}`
    : `${jogo.adversario} x Sport`;

  // Só existe placar se o jogo já foi encerrado
  let placar: string | null = null;
  if (jogo.resultado) {
    const { golsClube, golsAdversario } = jogo.resultado;
    placar = jogo.mandante
      ? `${golsClube} x ${golsAdversario}`
      : `${golsAdversario} x ${golsClube}`;
  }

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow">
      <p className="text-sm font-semibold uppercase text-clube">
        {jogo.competicao}
      </p>

      <h3 className="mt-1 text-xl font-bold">{confronto}</h3>

      <p className="mt-2 text-gray-700">
        <time dateTime={jogo.data}>
          {dataFormatada} às {hora}
        </time>
      </p>
      <p className="text-gray-700">{jogo.local}</p>

      <div className="mt-6">
        {placar ? (
          <p className="font-bold">
            Encerrado: <span className="text-2xl">{placar}</span>
          </p>
        ) : (
          // A tela de ingressos ainda não existe; será feita depois
          <Link
            to={`/ingressos?jogo=${jogo.id}`}
            className="inline-block rounded bg-clube px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Comprar ingresso
          </Link>
        )}
      </div>
    </article>
  );
}