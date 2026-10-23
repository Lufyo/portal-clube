import type { ReactNode } from "react";

type Props = {
  id: string;
  rotulo: string;
  erro?: string;
  ajuda?: string;
  children: ReactNode; // o campo em si (input, select ou textarea)
};

// Rótulo, campo e mensagem de erro (ou dica) em um bloco só
export default function Campo({ id, rotulo, erro, ajuda, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {rotulo}
      </label>
      <div className="mt-1">{children}</div>
      {erro ? (
        <p id={`${id}-erro`} className="mt-1 text-sm text-[#ff9aa2]">
          {erro}
        </p>
      ) : (
        ajuda && (
          <p id={`${id}-ajuda`} className="mt-1 text-sm text-marfim-apagado">
            {ajuda}
          </p>
        )
      )}
    </div>
  );
}