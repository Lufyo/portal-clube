import { useState } from "react";
import EditarDados from "../components/EditarDados";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MeuPlano from "../components/MeuPlano";
import PrivacidadeDados from "../components/PrivacidadeDados";
import TrocarSenha from "../components/TrocarSenha";
import { usePerfil } from "../hooks/usePerfil";
import { Link } from "react-router-dom";

// 52998224725 vira 529.982.247-25
function formatarCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// 1995-04-12 vira 12/04/1995 (sem usar Date, para evitar erro de fuso horário)
function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function MinhaArea() {
  const { perfil, erro, carregando, recarregar } = usePerfil();
  const [editando, setEditando] = useState(false);
  const [mensagemDados, setMensagemDados] = useState<string | null>(null);

  function aoSalvarDados() {
    setEditando(false);
    setMensagemDados("Dados atualizados com sucesso");
    recarregar();
  }

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">Minha área</h1>

        {carregando && <p className="mt-6">Carregando seus dados...</p>}

        {erro && (
          <p role="alert" className="mt-6 rounded bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {perfil && (
          <>
            <section
              aria-labelledby="titulo-dados"
              className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow"
            >
              <h2 id="titulo-dados" className="text-xl font-bold">
                Meus dados
              </h2>

              {mensagemDados && (
                <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">
                  {mensagemDados}
                </p>
              )}

              {editando ? (
                <EditarDados
                  perfil={perfil}
                  cpfFormatado={formatarCpf(perfil.cpf)}
                  onSalvo={aoSalvarDados}
                  onCancelar={() => setEditando(false)}
                />
              ) : (
                <>
                  {/* dl/dt/dd é a marcação correta para pares "rótulo: valor" */}
                  <dl className="mt-4 space-y-3">
                    <div>
                      <dt className="text-sm text-gray-600">Nome</dt>
                      <dd className="font-semibold">{perfil.nome}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">E-mail</dt>
                      <dd className="font-semibold">{perfil.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">CPF</dt>
                      <dd className="font-semibold">{formatarCpf(perfil.cpf)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Data de nascimento</dt>
                      <dd className="font-semibold">
                        {formatarData(perfil.dataNascimento)}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => {
                      setMensagemDados(null);
                      setEditando(true);
                    }}
                    className="mt-6 rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube"
                  >
                    Editar dados
                  </button>
                </>
              )}
            </section>

            <TrocarSenha />

            <MeuPlano planoAtual={perfil.plano} onAlterado={recarregar} />
           <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {perfil.plano && (
            <Link
              to="/carteira"
              className="rounded bg-clube px-4 py-3 text-center font-semibold text-white hover:bg-red-700"
            >
              Ver minha carteira
            </Link>
          )}
          <Link
            to="/mensalidades"
            className="rounded border-2 border-gray-300 px-4 py-3 text-center font-semibold hover:border-clube"
          >
            Ver mensalidades
          </Link>
        </div>

            <PrivacidadeDados />
          </>
        )}

      </main>
      <Footer />
    </>
  );
}