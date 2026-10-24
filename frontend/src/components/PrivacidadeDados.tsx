import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePrivacidade } from "../hooks/usePrivacidade";
import CampoFormulario from "./CampoFormulario";

// Seção "Privacidade e dados" da Minha área: os direitos do titular na LGPD
// de receber uma cópia dos próprios dados e de pedir a exclusão da conta.
export default function PrivacidadeDados() {
  const {
    baixarDados,
    baixando,
    erroDownload,
    excluirConta,
    excluindo,
    erroExclusao,
    errosCampos,
    limparErrosDaExclusao,
  } = usePrivacidade();
  const { sair } = useAuth();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");

  async function aoBaixar() {
    setMensagem(null);
    if (await baixarDados()) setMensagem("Seus dados foram baixados.");
  }

  function fecharExclusao() {
    setConfirmando(false);
    setSenhaAtual("");
    limparErrosDaExclusao();
  }

  async function aoExcluir(evento: FormEvent) {
    evento.preventDefault();
    if (await excluirConta(senhaAtual)) {
      // A rota protegida leva ao login, que mostra o aviso
      sair("Conta excluída. Seus dados pessoais foram apagados.");
    }
  }

  // Erro de um campo aparece no campo; os outros (ex.: pendências), em destaque
  const erroGeralDaExclusao = erroExclusao && Object.keys(errosCampos).length === 0;

  return (
    <section
      aria-labelledby="titulo-privacidade"
      className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow"
    >
      <h2 id="titulo-privacidade" className="text-xl font-bold">
        Privacidade e dados
      </h2>
      <p className="mt-2 text-gray-700">
        Pela Lei Geral de Proteção de Dados (LGPD), você pode receber uma cópia de tudo o que o
        portal guarda sobre você e pedir a exclusão da sua conta.
      </p>

      {mensagem && (
        <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">
          {mensagem}
        </p>
      )}
      {erroDownload && (
        <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">
          {erroDownload}
        </p>
      )}

      <button
        type="button"
        onClick={aoBaixar}
        disabled={baixando}
        className="mt-4 rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube disabled:opacity-60"
      >
        {baixando ? "Preparando o arquivo..." : "Baixar meus dados"}
      </button>

      <div className="mt-8 border-t border-gray-200 pt-6">
        {!confirmando ? (
          <button
            type="button"
            onClick={() => {
              setMensagem(null);
              setConfirmando(true);
            }}
            className="rounded border-2 border-clube px-4 py-3 font-semibold text-clube hover:bg-red-50"
          >
            Excluir minha conta
          </button>
        ) : (
          <form onSubmit={aoExcluir} className="space-y-4">
            <h3 className="font-bold">Excluir minha conta</h3>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              <li>Seu acesso ao portal é encerrado e seu plano é cancelado.</li>
              <li>Seu nome, CPF, e-mail e data de nascimento são apagados.</li>
              <li>
                O histórico de mensalidades e ingressos fica guardado sem identificar você, porque o
                clube precisa dele para a contabilidade.
              </li>
              <li>Se houver mensalidade em aberto ou ingresso para um jogo que ainda vai acontecer, resolva antes.</li>
              <li>
                <strong>Esta ação não pode ser desfeita.</strong>
              </li>
            </ul>

            {erroGeralDaExclusao && (
              <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
                {erroExclusao}
              </p>
            )}

            <CampoFormulario
              id="senhaExclusao"
              rotulo="Senha atual"
              tipo="password"
              valor={senhaAtual}
              onChange={setSenhaAtual}
              erro={errosCampos.senhaAtual}
              ajuda="Para confirmar que é você."
              autoComplete="current-password"
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={excluindo}
                className="rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {excluindo ? "Excluindo..." : "Excluir conta definitivamente"}
              </button>
              <button
                type="button"
                onClick={fecharExclusao}
                disabled={excluindo}
                className="rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
