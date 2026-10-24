import { useState, type FormEvent } from "react";
import { useEditarDados } from "../hooks/useEditarDados";
import type { Perfil } from "../types/auth";
import CampoFormulario from "./CampoFormulario";

type Props = {
  perfil: Perfil;
  cpfFormatado: string;
  onSalvo: () => void;
  onCancelar: () => void;
};

// Formulário de "Meus dados". O CPF aparece, mas não é editável: é o
// documento que identifica o sócio. Trocar o e-mail pede a senha atual.
export default function EditarDados({ perfil, cpfFormatado, onSalvo, onCancelar }: Props) {
  const { salvar, carregando, erro, errosCampos } = useEditarDados();
  const [nome, setNome] = useState(perfil.nome);
  const [email, setEmail] = useState(perfil.email);
  const [dataNascimento, setDataNascimento] = useState(perfil.dataNascimento);
  const [senhaAtual, setSenhaAtual] = useState("");

  const trocandoEmail = email.trim().toLowerCase() !== perfil.email;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const dados = { nome, email, dataNascimento, ...(trocandoEmail && { senhaAtual }) };
    if (await salvar(dados)) onSalvo();
  }

  const mostrarErroGeral = erro && Object.keys(errosCampos).length === 0;

  return (
    <form onSubmit={enviar} className="mt-4 space-y-4">
      {mostrarErroGeral && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
          {erro}
        </p>
      )}

      <CampoFormulario
        id="nome"
        rotulo="Nome completo"
        valor={nome}
        onChange={setNome}
        erro={errosCampos.nome}
        autoComplete="name"
      />
      <CampoFormulario
        id="email"
        rotulo="E-mail"
        tipo="email"
        valor={email}
        onChange={setEmail}
        erro={errosCampos.email}
        autoComplete="email"
      />
      {trocandoEmail && (
        <CampoFormulario
          id="senhaAtualEmail"
          rotulo="Senha atual"
          tipo="password"
          valor={senhaAtual}
          onChange={setSenhaAtual}
          erro={errosCampos.senhaAtual}
          ajuda="Para trocar o e-mail, confirme sua senha."
          autoComplete="current-password"
        />
      )}
      <CampoFormulario
        id="dataNascimento"
        rotulo="Data de nascimento"
        tipo="date"
        valor={dataNascimento}
        onChange={setDataNascimento}
        erro={errosCampos.dataNascimento}
        autoComplete="bday"
      />

      <dl>
        <dt className="text-sm text-gray-600">CPF</dt>
        <dd className="font-semibold">{cpfFormatado}</dd>
        <dd className="mt-1 text-sm text-gray-600">
          O CPF não pode ser alterado. Se estiver errado, fale com o atendimento do clube.
        </dd>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={carregando}
          className="rounded bg-clube px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {carregando ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={carregando}
          className="rounded border-2 border-gray-300 px-4 py-3 font-semibold hover:border-clube disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
