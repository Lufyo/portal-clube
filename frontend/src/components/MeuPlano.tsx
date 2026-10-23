import { useState } from "react";
import { useAssinatura } from "../hooks/useAssinatura";
import { usePlanos } from "../hooks/usePlanos";
import {
  lerPlanoEscolhido,
  limparPlanoEscolhido,
} from "../services/planoEscolhido";
import type { Perfil } from "../types/auth";

type Props = {
  planoAtual: Perfil["plano"];
  onAlterado: () => void; // avisa a página para recarregar os dados
};

const formatarPreco = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MeuPlano({ planoAtual, onAlterado }: Props) {
  const { planos, carregando: carregandoPlanos, erro: erroPlanos } = usePlanos();
  const { contratar, cancelar, carregando, erro } = useAssinatura();

  // Começa marcando o plano escolhido na landing; se não houve, o plano atual
  const [selecionado, setSelecionado] = useState(
    () => lerPlanoEscolhido() ?? planoAtual?.id ?? ""
  );
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function aoContratar() {
    setMensagem(null);
    if (await contratar(selecionado)) {
      limparPlanoEscolhido(); // a escolha da landing já foi usada
      setMensagem(
        planoAtual ? "Plano alterado com sucesso!" : "Plano contratado com sucesso!"
      );
      onAlterado();
    }
  }

  async function aoCancelar() {
    if (!window.confirm("Tem certeza que deseja cancelar seu plano?")) return;
    setMensagem(null);
    if (await cancelar()) {
      setSelecionado("");
      setMensagem("Plano cancelado.");
      onAlterado();
    }
  }

  return (
    <section
      aria-labelledby="titulo-plano"
      className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow"
    >
      <h2 id="titulo-plano" className="text-xl font-bold">
        Meu plano
      </h2>

      <p className="mt-2">
        {planoAtual ? (
          <>
            Plano atual: <strong>{planoAtual.nome}</strong> (
            {formatarPreco(planoAtual.preco)}/mês)
          </>
        ) : (
          "Você ainda não tem um plano de sócio."
        )}
      </p>

      {mensagem && (
        <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">
          {mensagem}
        </p>
      )}
      {(erro || erroPlanos) && (
        <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">
          {erro ?? erroPlanos}
        </p>
      )}

      {/* fieldset + legend agrupam as opções para leitores de tela */}
      <fieldset className="mt-6 space-y-3">
        <legend className="font-semibold">
          {planoAtual ? "Trocar de plano" : "Escolha um plano"}
        </legend>

        {carregandoPlanos && <p>Carregando planos...</p>}

        {planos.map((plano) => (
          <label
            key={plano.id}
            className={`flex cursor-pointer items-center gap-3 rounded border p-3 ${
              selecionado === plano.id ? "border-clube" : "border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="plano"
              value={plano.id}
              checked={selecionado === plano.id}
              onChange={() => setSelecionado(plano.id)}
            />
            <span>
              <span className="font-semibold">{plano.nome}</span> ·{" "}
              {formatarPreco(plano.preco)}/mês
            </span>
          </label>
        ))}
      </fieldset>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={aoContratar}
          // Desabilitado se nada foi escolhido ou se escolheu o plano que já tem
          disabled={carregando || !selecionado || selecionado === planoAtual?.id}
          className="rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {carregando
            ? "Salvando..."
            : planoAtual
              ? "Trocar de plano"
              : "Contratar plano"}
        </button>

        {planoAtual && (
          <button
            type="button"
            onClick={aoCancelar}
            disabled={carregando}
            className="rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube disabled:opacity-60"
          >
            Cancelar plano
          </button>
        )}
      </div>
    </section>
  );
}