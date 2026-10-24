import { describe, expect, it } from "vitest";
import { autenticarSocio, buscarPerfil, registrarSocio } from "../../../src/services/auth.service";
import { banco } from "../../apoio/supabaseFalso";

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
    banco.responder("perfis", { data: null, error: { code: "PGRST116" } });
    await expect(buscarPerfil("u1")).rejects.toMatchObject({ status: 404 });
  });
});
