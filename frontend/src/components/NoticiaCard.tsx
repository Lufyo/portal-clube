import type { Noticia } from "../types/noticia";

type Props = {
  noticia: Noticia;
};

export default function NoticiaCard({ noticia }: Props) {
  const dataFormatada = new Date(noticia.data).toLocaleDateString("pt-BR");

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow">
      <p className="text-sm font-semibold uppercase text-clube">
        {noticia.tipo} · {noticia.categoria}
      </p>

      <h3 className="mt-2 text-xl font-bold">{noticia.titulo}</h3>

      <p className="mt-2 flex-1 text-gray-700">{noticia.resumo}</p>

      <p className="mt-4 text-sm text-gray-600">
        <time dateTime={noticia.data}>{dataFormatada}</time>
      </p>
    </article>
  );
}