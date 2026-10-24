import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTrocarSenha } from "../hooks/useTrocarSenha";
import CampoFormulario from "./CampoFormulario";

// Seção "Senha" da Minha área. O formulário só aparece ao clicar em
// "Trocar senha" e é descartado depois, para as senhas não ficarem na tela.
export default function TrocarSenha() {
  const { trocar, carregando, erro, errosCampos, mostrarErroDoCampo, limparErros } = useTrocarSenha();
  const { sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  function fechar() {
    setAberto(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacao("");
    limparErros();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensagem(null);

    // Conferido aqui mesmo: a API não recebe a confirmação
    if (novaSenha !== confirmacao) {
      mostrarErroDoCampo("confirmacao", "As senhas não conferem");
      return;
    }
    const resultado = await trocar(senhaAtual, novaSenha);
    if (resultado === "trocada") {
      fechar();
      setMensagem("Senha alterada com sucesso");
    } else if (resultado === "entrar-de-novo") {
      // A senha mudou, mas a sessão acabou: a rota protegida leva ao login,
      // que mostra o aviso
      sair("Senha alterada. Entre de novo com a nova senha.");
    }
  }

  const mostrarErroGeral = erro && Object.keys(errosCampos).length === 0;

  return (
    <section
      aria-labelledby="titulo-senha"
      className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow"
    >
      <h2 id="titulo-senha" className="text-xl font-bold">
        Senha
      </h2>

      {mensagem && (
        <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">
          {mensagem}
        </p>
      )}

      {!aberto ? (
        <button
          type="button"
          onClick={() => {
            setMensagem(null);
            setAberto(true);
          }}
          className="mt-4 rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube"
        >
          Trocar senha
        </button>
      ) : (
        <form onSubmit={enviar} className="mt-4 space-y-4">
          {mostrarErroGeral && (
            <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
              {erro}
            </p>
          )}

          <CampoFormulario
            id="senhaAtual"
            rotulo="Senha atual"
            tipo="password"
            valor={senhaAtual}
            onChange={setSenhaAtual}
            erro={errosCampos.senhaAtual}
            autoComplete="current-password"
          />
          <CampoFormulario
            id="novaSenha"
            rotulo="Nova senha"
            tipo="password"
            valor={novaSenha}
            onChange={setNovaSenha}
            erro={errosCampos.novaSenha}
            ajuda="Mínimo de 8 caracteres, com letras e números."
            autoComplete="new-password"
          />
          <CampoFormulario
            id="confirmacao"
            rotulo="Confirme a nova senha"
            tipo="password"
            valor={confirmacao}
            onChange={setConfirmacao}
            erro={errosCampos.confirmacao}
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={carregando}
              className="rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </button>
            <button
              type="button"
              onClick={fechar}
              disabled={carregando}
              className="rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
