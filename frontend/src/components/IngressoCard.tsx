import { QRCodeSVG } from "qrcode.react";
import type { MeuIngresso } from "../types/ingresso";

type Props = {
  ingresso: MeuIngresso;
  passado: boolean; // jogo que já aconteceu fica mais apagado
};

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function IngressoCard({ ingresso, passado }: Props) {
  const { jogo } = ingresso;

  // O time da casa sempre aparece primeiro, como nas tabelas de futebol
  const confronto = jogo.mandante
    ? `Sport x ${jogo.adversario}`
    : `${jogo.adversario} x Sport`;

  const data = new Date(jogo.data);
  const dataTexto = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <article
      className={`imprimir-cores flex flex-col border-2 border-marfim-apagado/40 bg-carvao sm:flex-row ${
        passado ? "opacity-60" : ""
      }`}
    >
      {/* Setor */}
      <div className="border-l-8 border-rubro bg-vinho p-5 sm:w-44">
        <p className="text-sm text-marfim-apagado">Setor</p>
        <p className="titulo-display mt-1 text-3xl text-amarelo">
          {ingresso.setor}
        </p>
      </div>

      {/* Jogo */}
      <div className="flex-1 border-t-2 border-dashed border-marfim-apagado/40 p-5 sm:border-t-0 sm:border-l-2">
        <p className="text-sm font-semibold text-amarelo">{jogo.competicao}</p>
        <h3 className="titulo-display mt-1 text-3xl">{confronto}</h3>
        <p className="mt-3 capitalize text-marfim-apagado">
          {dataTexto} às {hora}
        </p>
        <p className="text-marfim-apagado">{jogo.local}</p>
        <p className="mt-3 text-sm text-marfim-apagado">
          Valor pago: <strong className="text-marfim">{moeda(ingresso.precoPago)}</strong>
        </p>
      </div>

      {/* QR code: o fundo claro é necessário para os leitores. Usamos marfim, não branco puro */}
      <div className="flex flex-col items-center justify-center gap-2 border-t-2 border-dashed border-marfim-apagado/40 p-5 sm:border-t-0 sm:border-l-2">
        <div className="bg-marfim p-2">
          <QRCodeSVG
            value={ingresso.codigo}
            size={104}
            bgColor="#f4e9d0"
            fgColor="#000000"
            title={`QR code do ingresso ${ingresso.codigo}`}
          />
        </div>
        <p className="font-mono text-xs text-marfim-apagado">{ingresso.codigo}</p>
      </div>
    </article>
  );
}