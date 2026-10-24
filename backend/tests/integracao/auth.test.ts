import { describe, expect, it } from "vitest";
import { api, entrarComo } from "../apoio/api";
import { banco } from "../apoio/supabaseFalso";

const cadastro = {
  nome: "Maria Leão da Silva",
  email: "Maria@Exemplo.com",
  cpf: "529.982.247-25",
  dataNascimento: "1995-04-13",
  senha: "leao1905",
};

describe("POST /api/auth/register", () => {
  it("cadastra e responde 201 sem devolver a senha", async () => {
    banco.cliente.auth.admin.createUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    banco.responder("perfis", {});

    const resposta = await api().post("/api/auth/register").send(cadastro);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      mensagem: "Cadastro realizado com sucesso",
      usuario: { id: "u1", nome: cadastro.nome, email: "maria@exemplo.com" },
    });
    expect(JSON.stringify(resposta.body)).not.toContain("leao1905");
  });

  it("responde 400 com a mensagem de cada campo inválido, sem tocar no banco", async () => {
    const resposta = await api()
      .post("/api/auth/register")
      .send({ ...cadastro, cpf: "111.111.111-11", senha: "curta" });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "Dados inválidos",
      campos: { cpf: "CPF inválido", senha: "A senha deve ter no mínimo 8 caracteres" },
    });
    expect(banco.cliente.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("responde 409 no campo CPF quando ele já está cadastrado", async () => {
    banco.cliente.auth.admin.createUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    banco.responder("perfis", { error: { code: "23505" } });

    const resposta = await api().post("/api/auth/register").send(cadastro);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "CPF já cadastrado", campos: { cpf: "CPF já cadastrado" } });
  });
});

describe("POST /api/auth/login", () => {
  it("devolve o token e o usuário", async () => {
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "jwt" }, user: { id: "u1", email: "maria@exemplo.com" } },
      error: null,
    });
    banco.responder("perfis", { data: { nome: "Maria", papel: "socio", plano: null } });

    const resposta = await api().post("/api/auth/login").send({ email: "maria@exemplo.com", senha: "leao1905" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      token: "jwt",
      usuario: { id: "u1", nome: "Maria", email: "maria@exemplo.com", papel: "socio" },
    });
  });

  it("responde 401 com credenciais erradas", async () => {
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: { message: "x" } });

    const resposta = await api().post("/api/auth/login").send({ email: "maria@exemplo.com", senha: "errada123" });

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ erro: "E-mail ou senha incorretos" });
  });
});

describe("GET /api/auth/me", () => {
  it("exige login", async () => {
    const resposta = await api().get("/api/auth/me");
    expect(resposta.status).toBe(401);
  });

  it("devolve o perfil em camelCase, com o plano", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", {
      data: {
        id: "u1",
        nome: "Maria",
        cpf: "52998224725",
        data_nascimento: "1995-04-13",
        numero_socio: 42,
        papel: "socio",
        plano: { id: "p1", nome: "Leão Ouro", preco_mensal: 99.9 },
      },
    });

    const resposta = await api().get("/api/auth/me").set(cabecalho);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      id: "u1",
      nome: "Maria",
      cpf: "52998224725",
      dataNascimento: "1995-04-13",
      numeroSocio: 42,
      papel: "socio",
      email: "u1@exemplo.com",
      plano: { id: "p1", nome: "Leão Ouro", preco: 99.9 },
    });
  });

  it("devolve plano null para quem ainda não contratou", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", {
      data: { id: "u1", nome: "Maria", cpf: "1", data_nascimento: "1995-04-13", numero_socio: 1, papel: "socio", plano: null },
    });

    const resposta = await api().get("/api/auth/me").set(cabecalho);

    expect(resposta.body.plano).toBeNull();
  });
});
