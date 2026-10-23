import { QRCodeSVG } from "qrcode.react";

type Props = {
  nome: string;
  cpf: string;
  numeroSocio: number;
  plano: string;
};

// 52998224725 vira ***.***.247-25 (mostramos só parte do CPF, por privacidade)
function mascararCpf(cpf: string) {
  return `***.***.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export default function CarteiraSocio({ nome, cpf, numeroSocio, plano }: Props) {
  // 1 vira "000001"
  const numero = String(numeroSocio).padStart(6, "0");

  return (
    <div className="imprimir-cores w-full max-w-md rounded-2xl bg-linear-to-br from-clube-escuro to-clube p-6 text-white shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wide">
        Sócio-torcedor
      </p>
      <p className="text-xl font-extrabold">Sport Club do Recife</p>

      <div className="mt-8 flex items-end justify-between gap-4">
        {/* dl/dt/dd é a marcação correta para pares "rótulo: valor" */}
        <dl className="space-y-3">
          <div>
            <dt className="text-xs uppercase">Nome</dt>
            <dd className="text-lg font-bold">{nome}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase">Nº de sócio</dt>
            <dd className="font-mono text-lg font-bold">{numero}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase">CPF</dt>
            <dd className="font-semibold">{mascararCpf(cpf)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase">Plano</dt>
            <dd className="font-semibold">{plano}</dd>
          </div>
        </dl>

        {/* Fundo branco é obrigatório: leitores de QR code precisam de contraste */}
        <div className="shrink-0 rounded bg-white p-2">
          <QRCodeSVG
            value={numero}
            size={96}
            title="QR code da carteira de sócio"
          />
        </div>
      </div>
    </div>
  );
}