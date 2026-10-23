import { Link } from "react-router-dom";
import type { Noticia } from "../types/noticia";

type Props = {
  noticia: Noticia;
};

export default function NoticiaCard({ noticia }: Props) {
  const dataFormatada = new Date(noticia.data).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow">
      <p className="text-sm font-semibold uppercase text-clube">
        {noticia.tipo} · {noticia.categoria}
      </p>

      <h3 className="mt-2 text-xl font-bold">{noticia.titulo}</h3>

      <p className="mt-2 flex-1 text-gray-700">{noticia.resumo}</p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          <time dateTime={noticia.data}>{dataFormatada}</time>
        </p>
        <Link
          to={`/noticias/${noticia.id}`}
          className="font-bold text-amarelo underline"
        >
          Ler notícia
          {/* Leitores de tela ouvem "Ler notícia: título", sem repetir "Ler notícia" várias vezes sem contexto */}
          <span className="sr-only">: {noticia.titulo}</span>
        </Link>
      </div>
    </article>
  );
}