import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { guardarPlanoEscolhido } from "../services/planoEscolhido";
import type { Plano } from "../types/plano";

type Props = {
  plano: Plano;
};

export default function PlanoCard({ plano }: Props) {
  const { usuario } = useAuth();

  // Formata o número como moeda brasileira: 59.9 vira "R$ 59,90"
  const precoFormatado = plano.preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Quem já está logado vai direto para a Minha área; os demais, para o cadastro
  const destino = usuario ? "/minha-area" : "/cadastro";

  return (
    <article
      className={`revelar flex flex-col rounded-lg bg-white p-6 shadow ${
        plano.destaque ? "border-2 border-clube" : "border border-gray-200"
      }`}
    >
      {plano.destaque && (
        <span className="mb-2 self-start rounded bg-clube px-2 py-1 text-xs font-bold uppercase text-white">
          Mais popular
        </span>
      )}

      <h3 className="text-xl font-bold">{plano.nome}</h3>

      <p className="mt-2 text-3xl font-extrabold">
        {precoFormatado}
        <span className="text-base font-normal text-gray-600"> /mês</span>
      </p>

      <ul className="mt-6 flex-1 space-y-2">
        {plano.beneficios.map((beneficio) => (
          <li key={beneficio} className="flex gap-2">
            <span aria-hidden="true" className="text-clube">
              ✓
            </span>
            {beneficio}
          </li>
        ))}
      </ul>

      {/* Guarda o plano escolhido; a Minha área vai usá-lo na Etapa 19 */}
      <Link
        to={destino}
        onClick={() => guardarPlanoEscolhido(plano.id)}
        className="mt-6 rounded bg-clube px-4 py-3 text-center font-semibold text-white hover:bg-red-700"
      >
        Quero o plano {plano.nome}
      </Link>
    </article>
  );
}