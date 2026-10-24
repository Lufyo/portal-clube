import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import CampoFormulario from "../components/CampoFormulario";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { useLogin } from "../hooks/useLogin";

export default function Login() {
  const { usuario } = useAuth();
  const { login, carregando, erro, errosCampos } = useLogin();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Mensagem enviada pela tela de cadastro ("Cadastro realizado!")
  const mensagem = (location.state as { mensagem?: string } | null)?.mensagem;

  // Se veio de uma página protegida, volta para ela depois de entrar
  const destino =
    (location.state as { de?: string } | null)?.de ?? "/minha-area";

  // Se já está logado (inclusive logo após entrar), segue para o destino
  if (usuario) {
    return <Navigate to={destino} replace />;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    await login(email, senha);
    // Em caso de sucesso, o usuário passa a existir no contexto
    // e o redirecionamento acima acontece sozinho
  }

  const mostrarErroGeral = erro && Object.keys(errosCampos).length === 0;

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="mt-2 text-gray-700">Acesse sua conta de sócio.</p>

        {mensagem && (
          <p role="status" className="mt-6 rounded bg-green-50 p-3 text-green-800">
            {mensagem}
          </p>
        )}

        <form onSubmit={enviar} className="mt-8 space-y-4">
          {mostrarErroGeral && (
            <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
              {erro}
            </p>
          )}

          <CampoFormulario
            id="email"
            rotulo="E-mail"
            tipo="email"
            valor={email}
            onChange={setEmail}
            erro={errosCampos.email}
            autoComplete="email"
          />
          <CampoFormulario
            id="senha"
            rotulo="Senha"
            tipo="password"
            valor={senha}
            onChange={setSenha}
            erro={errosCampos.senha}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-700">
          Ainda não é sócio?{" "}
          <Link to="/cadastro" className="font-semibold text-clube underline">
            Cadastre-se
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}