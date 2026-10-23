import { criarCliente, supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

export async function registrarSocio(dados: RegisterInput) {
  // 1. Cria o usuário no Supabase Auth (a senha é guardada com hash por ele).
  // email_confirm: true pula o e-mail de confirmação, para simplificar o projeto.
  const { data, error } = await supabase.auth.admin.createUser({
    email: dados.email,
    password: dados.senha,
    email_confirm: true,
  });

  if (error || !data.user) {
    if (error?.code === "email_exists" || /already/i.test(error?.message ?? "")) {
      throw new ErroDeNegocio("E-mail já cadastrado", 409, "email");
    }
    console.error(error);
    throw new ErroDeNegocio("Não foi possível criar a conta", 500);
  }

  // 2. Grava os dados extras na tabela perfis, usando o mesmo id do usuário
  const { error: erroPerfil } = await supabase.from("perfis").insert({
    id: data.user.id,
    nome: dados.nome,
    cpf: dados.cpf,
    data_nascimento: dados.dataNascimento,
  });

  if (erroPerfil) {
    // Se o perfil falhar, desfazemos o passo 1 para não deixar um usuário
    // "pela metade" (existe no Auth, mas sem perfil)
    await supabase.auth.admin.deleteUser(data.user.id);

    // 23505 = violação de unicidade no Postgres (CPF já existe)
    if (erroPerfil.code === "23505") {
      throw new ErroDeNegocio("CPF já cadastrado", 409, "cpf");
    }
    console.error(erroPerfil);
    throw new ErroDeNegocio("Não foi possível salvar o perfil", 500);
  }

  // Nunca devolvemos a senha
  return { id: data.user.id, nome: dados.nome, email: dados.email };
}

export async function autenticarSocio(dados: LoginInput) {
  // Cliente temporário, para a sessão não contaminar o cliente principal
  const clienteAuth = criarCliente();

  const { data, error } = await clienteAuth.auth.signInWithPassword({
    email: dados.email,
    password: dados.senha,
  });

  // Mensagem única de propósito: não revelamos se foi o e-mail ou a senha
  if (error || !data.session) {
    throw new ErroDeNegocio("E-mail ou senha incorretos", 401);
  }

  const perfil = await buscarPerfil(data.user.id);

  return {
    token: data.session.access_token,
    usuario: {
      id: data.user.id,
      nome: perfil.nome,
      email: data.user.email,
      papel: perfil.papel,
    },
  };
}

export async function buscarPerfil(id: string) {
  const { data, error } = await supabase
    .from("perfis")
    // plano:planos(...) traz junto os dados do plano ligado a este perfil
    .select(
      "id, nome, cpf, data_nascimento, numero_socio, papel, plano:planos(id, nome, preco_mensal)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new ErroDeNegocio("Perfil não encontrado", 404);
  }
  return data;
}