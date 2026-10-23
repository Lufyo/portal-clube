import { usePlanos } from "../hooks/usePlanos";
import PlanoCard from "./PlanoCard";

export default function PlanosSection() {
  const { planos, carregando, erro } = usePlanos();

  return (
    <section
      id="planos"
      aria-labelledby="titulo-planos"
      className="scroll-mt-16 bg-gray-50 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="titulo-planos" className="text-3xl font-bold">
          Escolha seu plano de sócio
        </h2>
        <p className="mt-2 text-gray-700">
          Associe-se e faça parte da história do clube.
        </p>

        {carregando && <p className="mt-10">Carregando planos...</p>}

        {erro && (
          <p role="alert" className="mt-10 rounded bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {/* 1 coluna no celular, 3 colunas a partir de md */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {planos.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} />
          ))}
        </div>
      </div>
    </section>
  );
}