import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import CampoFormulario from "../components/CampoFormulario";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useRegister, type DadosCadastro } from "../hooks/useRegister";

export default function Cadastro() {
  const navigate = useNavigate();
  const { registrar, carregando, erro, errosCampos } = useRegister();

  const [form, setForm] = useState<DadosCadastro>({
    nome: "",
    email: "",
    cpf: "",
    dataNascimento: "",
    senha: "",
  });

  // Atualiza um único campo, mantendo os outros
  function atualizar(campo: keyof DadosCadastro, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault(); // impede o recarregamento da página
    const sucesso = await registrar(form);

    if (sucesso) {
      // A tela de login (próxima etapa) vai exibir esta mensagem
      navigate("/login", {
        state: { mensagem: "Cadastro realizado! Faça login para continuar." },
      });
    }
  }

  // O erro geral só aparece quando não há erros de campo
  // (ex.: servidor fora do ar ou falha inesperada)
  const mostrarErroGeral = erro && Object.keys(errosCampos).length === 0;

  return (
    <>
      <Header />
      <main id="conteudo" className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Seja sócio</h1>
        <p className="mt-2 text-gray-700">
          Preencha seus dados para criar sua conta.
        </p>

        <form onSubmit={enviar} className="mt-8 space-y-4">
          {mostrarErroGeral && (
            <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
              {erro}
            </p>
          )}

          <CampoFormulario
            id="nome"
            rotulo="Nome completo"
            valor={form.nome}
            onChange={(v) => atualizar("nome", v)}
            erro={errosCampos.nome}
            autoComplete="name"
          />
          <CampoFormulario
            id="email"
            rotulo="E-mail"
            tipo="email"
            valor={form.email}
            onChange={(v) => atualizar("email", v)}
            erro={errosCampos.email}
            autoComplete="email"
          />
          <CampoFormulario
            id="cpf"
            rotulo="CPF"
            valor={form.cpf}
            onChange={(v) => atualizar("cpf", v)}
            erro={errosCampos.cpf}
            placeholder="000.000.000-00"
          />
          <CampoFormulario
            id="dataNascimento"
            rotulo="Data de nascimento"
            tipo="date"
            valor={form.dataNascimento}
            onChange={(v) => atualizar("dataNascimento", v)}
            erro={errosCampos.dataNascimento}
            autoComplete="bday"
          />
          <CampoFormulario
            id="senha"
            rotulo="Senha"
            tipo="password"
            valor={form.senha}
            onChange={(v) => atualizar("senha", v)}
            erro={errosCampos.senha}
            ajuda="Mínimo de 8 caracteres, com letras e números."
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {carregando ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-700">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-clube underline">
            Entrar
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}