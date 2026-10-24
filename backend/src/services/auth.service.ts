import { criarCliente, supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";
import type {
  LoginInput,
  PerfilInput,
  RegisterInput,
  TrocaDeSenhaInput,
} from "../schemas/auth.schema";

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

// Sem os tipos gerados do banco, o supabase-js trata "plano:planos(...)" como
// lista. Cada perfil aponta para um plano só, então ele chega como objeto (ou null).
type PerfilComPlano = {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  numero_socio: number;
  papel: string;
  plano: { id: string; nome: string; preco_mensal: number } | null;
};

export async function buscarPerfil(id: string) {
  const { data, error } = await supabase
    .from("perfis")
    // plano:planos(...) traz junto os dados do plano ligado a este perfil
    .select(
      "id, nome, cpf, data_nascimento, numero_socio, papel, plano:planos(id, nome, preco_mensal)"
    )
    .eq("id", id)
    // maybeSingle: perfil inexistente chega como null; "error" é falha do banco
    .maybeSingle();

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar o perfil", 500);
  }
  if (!data) {
    throw new ErroDeNegocio("Perfil não encontrado", 404);
  }
  return data as unknown as PerfilComPlano;
}
// Confere a senha do usuário tentando um login com ela. Usa um cliente
// temporário, como o autenticarSocio, para não misturar sessões.
export async function senhaConfere(email: string, senha: string) {
  const { data, error } = await criarCliente().auth.signInWithPassword({ email, password: senha });
  return !error && Boolean(data.session);
}

// Editar dados: nome e data de nascimento no perfil e, se mudou, o e-mail no
// Auth. Trocar o e-mail exige a senha atual: quem pegar uma sessão aberta não
// consegue tomar a conta trocando o e-mail.
export async function atualizarPerfil(usuarioId: string, emailAtual: string, dados: PerfilInput) {
  if (dados.email !== emailAtual) {
    if (!dados.senhaAtual) {
      throw new ErroDeNegocio("Informe sua senha para trocar o e-mail", 400, "senhaAtual");
    }
    if (!(await senhaConfere(emailAtual, dados.senhaAtual))) {
      throw new ErroDeNegocio("Senha incorreta", 400, "senhaAtual");
    }

    // email_confirm: true, como no cadastro, para não depender de e-mail de confirmação
    const { error } = await supabase.auth.admin.updateUserById(usuarioId, {
      email: dados.email,
      email_confirm: true,
    });
    if (error) {
      if (error.code === "email_exists" || /already/i.test(error.message ?? "")) {
        throw new ErroDeNegocio("E-mail já cadastrado", 409, "email");
      }
      console.error(error);
      throw new ErroDeNegocio("Não foi possível trocar o e-mail", 500);
    }
  }

  const { error } = await supabase
    .from("perfis")
    .update({ nome: dados.nome, data_nascimento: dados.dataNascimento })
    .eq("id", usuarioId);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível salvar seus dados", 500);
  }
}

export async function trocarSenha(usuarioId: string, email: string, dados: TrocaDeSenhaInput) {
  // 400 (e não 401): a sessão continua válida, só a senha digitada está errada
  if (!(await senhaConfere(email, dados.senhaAtual))) {
    throw new ErroDeNegocio("Senha atual incorreta", 400, "senhaAtual");
  }

  const { error } = await supabase.auth.admin.updateUserById(usuarioId, { password: dados.novaSenha });
  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível trocar a senha", 500);
  }

  // Trocar a senha encerra todas as sessões da conta, inclusive a atual (o
  // token de quem trocou passa a dar 401). Entra de novo com a senha nova para
  // a pessoa continuar logada neste aparelho; nos outros, a sessão acaba.
  // Se esse login falhar, a senha já foi trocada: o site pede para entrar de novo.
  try {
    const { data } = await criarCliente().auth.signInWithPassword({ email, password: dados.novaSenha });
    return { token: data.session?.access_token ?? null };
  } catch (erroLogin) {
    console.error(erroLogin);
    return { token: null };
  }
}
