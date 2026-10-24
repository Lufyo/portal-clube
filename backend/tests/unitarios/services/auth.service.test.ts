import { describe, expect, it } from "vitest";
import {
  atualizarPerfil,
  autenticarSocio,
  buscarPerfil,
  registrarSocio,
  trocarSenha,
} from "../../../src/services/auth.service";
import { banco, filtrosEq } from "../../apoio/supabaseFalso";

const cadastro = {
  nome: "Maria Leão da Silva",
  email: "maria@exemplo.com",
  cpf: "52998224725",
  dataNascimento: "1995-04-13",
  senha: "leao1905",
};

const { admin } = banco.cliente.auth;

describe("registrarSocio", () => {
  it("cria o usuário no Auth, grava o perfil com o mesmo id e não devolve a senha", async () => {
    admin.createUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    banco.responder("perfis", {});

    const usuario = await registrarSocio(cadastro);

    expect(admin.createUser).toHaveBeenCalledWith({
      email: "maria@exemplo.com",
      password: "leao1905",
      email_confirm: true,
    });
    const insert = banco.consultasA("perfis")[0].operacoes.find((o) => o.metodo === "insert")!;
    expect(insert.argumentos[0]).toEqual({
      id: "u1",
      nome: cadastro.nome,
      cpf: cadastro.cpf,
      data_nascimento: cadastro.dataNascimento,
    });
    expect(usuario).toEqual({ id: "u1", nome: cadastro.nome, email: cadastro.email });
  });

  it("responde 409 no campo e-mail quando ele já existe", async () => {
    admin.createUser.mockResolvedValueOnce({ data: { user: null }, error: { code: "email_exists" } });

    await expect(registrarSocio(cadastro)).rejects.toMatchObject({ status: 409, campo: "email" });
  });

  it("desfaz o usuário do Auth e responde 409 no campo CPF quando ele já existe", async () => {
    admin.createUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    banco.responder("perfis", { error: { code: "23505" } });

    await expect(registrarSocio(cadastro)).rejects.toMatchObject({ status: 409, campo: "cpf" });
    expect(admin.deleteUser).toHaveBeenCalledWith("u1");
  });

  it("desfaz o usuário do Auth quando o perfil falha por outro motivo", async () => {
    admin.createUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    banco.responder("perfis", { error: { code: "XX000" } });

    await expect(registrarSocio(cadastro)).rejects.toMatchObject({ status: 500 });
    expect(admin.deleteUser).toHaveBeenCalledWith("u1");
  });
});

describe("autenticarSocio", () => {
  it("devolve o token e os dados básicos do usuário", async () => {
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "jwt" }, user: { id: "u1", email: "maria@exemplo.com" } },
      error: null,
    });
    banco.responder("perfis", { data: { id: "u1", nome: "Maria", papel: "socio", plano: null } });

    expect(await autenticarSocio({ email: "maria@exemplo.com", senha: "leao1905" })).toEqual({
      token: "jwt",
      usuario: { id: "u1", nome: "Maria", email: "maria@exemplo.com", papel: "socio" },
    });
  });

  it("responde 401 com mensagem única, sem dizer se errou e-mail ou senha", async () => {
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(autenticarSocio({ email: "maria@exemplo.com", senha: "errada1" })).rejects.toMatchObject({
      status: 401,
      message: "E-mail ou senha incorretos",
    });
  });
});

describe("buscarPerfil", () => {
  it("responde 404 quando o perfil não existe", async () => {
    banco.responder("perfis", { data: null });
    await expect(buscarPerfil("u1")).rejects.toMatchObject({ status: 404 });
  });

  it("falha do banco é erro do servidor, não 'perfil não encontrado'", async () => {
    banco.responder("perfis", { data: null, error: { message: "timeout" } });

    await expect(buscarPerfil("u1")).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível carregar o perfil",
    });
  });
});

// Conferência da senha atual: o Supabase Auth aceita ou recusa o login
function senhaAtual(correta: boolean) {
  banco.cliente.auth.signInWithPassword.mockResolvedValueOnce(
    correta
      ? { data: { session: { access_token: "t" }, user: { id: "u1" } }, error: null }
      : { data: { session: null, user: null }, error: { message: "Invalid login credentials" } }
  );
}

describe("atualizarPerfil", () => {
  const dados = { nome: "Maria Silva", email: "maria@exemplo.com", dataNascimento: "1995-04-13" };

  it("sem trocar o e-mail, atualiza só o perfil, sem pedir senha nem mexer no Auth", async () => {
    banco.responder("perfis", {});

    await atualizarPerfil("u1", "maria@exemplo.com", dados);

    const [consulta] = banco.consultasA("perfis");
    expect(consulta.operacoes.find((o) => o.metodo === "update")!.argumentos[0]).toEqual({
      nome: "Maria Silva",
      data_nascimento: "1995-04-13",
    });
    expect(filtrosEq(consulta)).toEqual({ id: "u1" });
    expect(banco.cliente.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(banco.cliente.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("trocar o e-mail exige a senha atual", async () => {
    await expect(
      atualizarPerfil("u1", "maria@exemplo.com", { ...dados, email: "nova@exemplo.com" })
    ).rejects.toMatchObject({ status: 400, campo: "senhaAtual", message: "Informe sua senha para trocar o e-mail" });
    expect(banco.cliente.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("com a senha errada, não troca o e-mail nem os dados", async () => {
    senhaAtual(false);

    await expect(
      atualizarPerfil("u1", "maria@exemplo.com", { ...dados, email: "nova@exemplo.com", senhaAtual: "errada123" })
    ).rejects.toMatchObject({ status: 400, campo: "senhaAtual", message: "Senha incorreta" });
    expect(banco.cliente.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "maria@exemplo.com",
      password: "errada123",
    });
    expect(banco.cliente.auth.admin.updateUserById).not.toHaveBeenCalled();
    expect(banco.consultasA("perfis")).toHaveLength(0);
  });

  it("com a senha certa, troca o e-mail no Auth e atualiza o perfil", async () => {
    senhaAtual(true);
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: {}, error: null });
    banco.responder("perfis", {});

    await atualizarPerfil("u1", "maria@exemplo.com", { ...dados, email: "nova@exemplo.com", senhaAtual: "leao1905" });

    expect(banco.cliente.auth.admin.updateUserById).toHaveBeenCalledWith("u1", {
      email: "nova@exemplo.com",
      email_confirm: true,
    });
    expect(banco.consultasA("perfis")).toHaveLength(1);
  });

  it("e-mail já usado por outra conta responde 409 no campo e-mail", async () => {
    senhaAtual(true);
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: null, error: { code: "email_exists" } });

    await expect(
      atualizarPerfil("u1", "maria@exemplo.com", { ...dados, email: "outra@exemplo.com", senhaAtual: "leao1905" })
    ).rejects.toMatchObject({ status: 409, campo: "email", message: "E-mail já cadastrado" });
    expect(banco.consultasA("perfis")).toHaveLength(0);
  });

  it("falha do banco ao salvar o perfil é erro do servidor", async () => {
    banco.responder("perfis", { error: { message: "timeout" } });
    await expect(atualizarPerfil("u1", "maria@exemplo.com", dados)).rejects.toMatchObject({ status: 500 });
  });
});

describe("trocarSenha", () => {
  it("confere a senha atual, grava a nova e devolve um token novo", async () => {
    senhaAtual(true);
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: {}, error: null });
    // Trocar a senha encerra as sessões da conta: entra de novo com a nova
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "token-novo" }, user: { id: "u1" } },
      error: null,
    });

    const resultado = await trocarSenha("u1", "maria@exemplo.com", { senhaAtual: "leao1905", novaSenha: "sport1905" });

    expect(banco.cliente.auth.signInWithPassword).toHaveBeenNthCalledWith(1, {
      email: "maria@exemplo.com",
      password: "leao1905",
    });
    expect(banco.cliente.auth.admin.updateUserById).toHaveBeenCalledWith("u1", { password: "sport1905" });
    expect(banco.cliente.auth.signInWithPassword).toHaveBeenNthCalledWith(2, {
      email: "maria@exemplo.com",
      password: "sport1905",
    });
    expect(resultado).toEqual({ token: "token-novo" });
  });

  it("se o novo login falhar, a senha continua trocada e não há token novo", async () => {
    senhaAtual(true);
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: {}, error: null });
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: { message: "x" } });

    const resultado = await trocarSenha("u1", "maria@exemplo.com", { senhaAtual: "leao1905", novaSenha: "sport1905" });

    expect(resultado).toEqual({ token: null });
  });

  it("senha atual errada responde 400 no campo da senha atual e não troca nada", async () => {
    senhaAtual(false);

    await expect(
      trocarSenha("u1", "maria@exemplo.com", { senhaAtual: "errada123", novaSenha: "sport1905" })
    ).rejects.toMatchObject({ status: 400, campo: "senhaAtual", message: "Senha atual incorreta" });
    expect(banco.cliente.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("falha do Auth ao gravar a nova senha é erro do servidor", async () => {
    senhaAtual(true);
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: null, error: { message: "timeout" } });

    await expect(
      trocarSenha("u1", "maria@exemplo.com", { senhaAtual: "leao1905", novaSenha: "sport1905" })
    ).rejects.toMatchObject({ status: 500, message: "Não foi possível trocar a senha" });
  });
});
