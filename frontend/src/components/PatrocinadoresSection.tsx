import { patrocinadores } from "../data/patrocinadores";

export default function PatrocinadoresSection() {
  return (
    <section
      id="patrocinadores"
      aria-labelledby="titulo-patrocinadores"
      className="scroll-mt-16 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="titulo-patrocinadores" className="text-3xl font-bold">
          Patrocinadores
        </h2>
        <p className="mt-2 text-gray-700">
          Empresas que caminham junto com o clube.
        </p>

        {/* 2 colunas no celular, 3 em tablet e 6 em tela grande */}
        <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {patrocinadores.map((patrocinador) => (
            <li
              key={patrocinador.id}
              className="flex h-24 items-center justify-center rounded-lg border border-gray-200 bg-white p-4 text-center font-semibold text-gray-700"
            >
              {patrocinador.nome}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}