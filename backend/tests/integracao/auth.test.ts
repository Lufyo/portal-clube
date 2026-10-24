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

describe("PATCH /api/auth/me (editar dados)", () => {
  const perfilNoBanco = {
    id: "u1",
    nome: "Maria Silva",
    cpf: "52998224725",
    data_nascimento: "1995-04-13",
    numero_socio: 42,
    papel: "socio",
    plano: null,
  };

  it("exige login", async () => {
    expect((await api().patch("/api/auth/me").send({})).status).toBe(401);
  });

  it("valida os campos antes de tocar no banco", async () => {
    const resposta = await api().patch("/api/auth/me").set(entrarComo("u1")).send({ nome: "Ma" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toMatchObject({ nome: "Informe seu nome completo", email: "Informe seu e-mail" });
    expect(banco.consultasA("perfis")).toHaveLength(0);
  });

  it("salva nome e data de nascimento e devolve o perfil atualizado", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", {}, { data: perfilNoBanco });

    const resposta = await api()
      .patch("/api/auth/me")
      .set(cabecalho)
      .send({ nome: "Maria Silva", email: "u1@exemplo.com", dataNascimento: "1995-04-13", cpf: "11111111111" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      mensagem: "Dados atualizados com sucesso",
      perfil: { nome: "Maria Silva", email: "u1@exemplo.com", cpf: "52998224725" },
    });
    // O CPF enviado é ignorado
    const update = banco.consultasA("perfis")[0].operacoes.find((o) => o.metodo === "update")!;
    expect(update.argumentos[0]).not.toHaveProperty("cpf");
  });

  it("trocar o e-mail com a senha errada responde 400 no campo da senha", async () => {
    const cabecalho = entrarComo("u1");
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: { message: "x" } });

    const resposta = await api()
      .patch("/api/auth/me")
      .set(cabecalho)
      .send({ nome: "Maria Silva", email: "nova@exemplo.com", dataNascimento: "1995-04-13", senhaAtual: "errada123" });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: "Senha incorreta", campos: { senhaAtual: "Senha incorreta" } });
  });

  it("trocar o e-mail com a senha certa devolve o perfil com o e-mail novo", async () => {
    const cabecalho = entrarComo("u1");
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "t" }, user: { id: "u1" } },
      error: null,
    });
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: {}, error: null });
    banco.responder("perfis", {}, { data: perfilNoBanco });

    const resposta = await api()
      .patch("/api/auth/me")
      .set(cabecalho)
      .send({ nome: "Maria Silva", email: "nova@exemplo.com", dataNascimento: "1995-04-13", senhaAtual: "leao1905" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.perfil.email).toBe("nova@exemplo.com");
    // A senha atual foi conferida com o e-mail de antes
    expect(banco.cliente.auth.signInWithPassword).toHaveBeenCalledWith({ email: "u1@exemplo.com", password: "leao1905" });
  });
});

describe("PUT /api/auth/senha (trocar senha)", () => {
  it("exige login", async () => {
    expect((await api().put("/api/auth/senha").send({})).status).toBe(401);
  });

  it("recusa nova senha fraca ou igual à atual", async () => {
    const fraca = await api()
      .put("/api/auth/senha")
      .set(entrarComo("u1"))
      .send({ senhaAtual: "leao1905", novaSenha: "abc" });
    expect(fraca.status).toBe(400);
    expect(fraca.body.campos).toEqual({ novaSenha: "A senha deve ter no mínimo 8 caracteres" });

    const igual = await api()
      .put("/api/auth/senha")
      .set(entrarComo("u1"))
      .send({ senhaAtual: "leao1905", novaSenha: "leao1905" });
    expect(igual.body.campos).toEqual({ novaSenha: "A nova senha deve ser diferente da atual" });
  });

  it("senha atual errada responde 400 e não troca nada", async () => {
    const cabecalho = entrarComo("u1");
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: { message: "x" } });

    const resposta = await api()
      .put("/api/auth/senha")
      .set(cabecalho)
      .send({ senhaAtual: "errada123", novaSenha: "sport1905" });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: "Senha atual incorreta", campos: { senhaAtual: "Senha atual incorreta" } });
    expect(banco.cliente.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("troca a senha do dono do token", async () => {
    const cabecalho = entrarComo("u1");
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "t" }, user: { id: "u1" } },
      error: null,
    });
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: {}, error: null });
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "token-novo" }, user: { id: "u1" } },
      error: null,
    });

    const resposta = await api()
      .put("/api/auth/senha")
      .set(cabecalho)
      .send({ senhaAtual: "leao1905", novaSenha: "sport1905" });

    expect(resposta.status).toBe(200);
    // O token antigo deixa de valer: a resposta traz um novo para continuar logado
    expect(resposta.body).toEqual({ mensagem: "Senha alterada com sucesso", token: "token-novo" });
    expect(banco.cliente.auth.admin.updateUserById).toHaveBeenCalledWith("u1", { password: "sport1905" });
  });
});

describe("as rotas da conta só mexem na conta do dono do token", () => {
  const senhaCerta = () =>
    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "t" }, user: { id: "u1" } },
      error: null,
    });

  it("PUT /api/auth/senha ignora um usuarioId enviado no corpo", async () => {
    const cabecalho = entrarComo("u1");
    senhaCerta();
    banco.cliente.auth.admin.updateUserById.mockResolvedValueOnce({ data: {}, error: null });

    banco.cliente.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: "token-novo" }, user: { id: "u1" } },
      error: null,
    });

    await api()
      .put("/api/auth/senha")
      .set(cabecalho)
      .send({ senhaAtual: "leao1905", novaSenha: "sport1905", usuarioId: "outra-conta" });

    expect(banco.cliente.auth.admin.updateUserById).toHaveBeenCalledWith("u1", { password: "sport1905" });
    // A senha atual conferida é a do dono do token
    expect(banco.cliente.auth.signInWithPassword).toHaveBeenCalledWith({ email: "u1@exemplo.com", password: "leao1905" });
  });

  it("PATCH /api/auth/me ignora um id enviado no corpo", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", {}, {
      data: { id: "u1", nome: "Maria Silva", cpf: "1", data_nascimento: "1995-04-13", numero_socio: 1, papel: "socio", plano: null },
    });

    await api()
      .patch("/api/auth/me")
      .set(cabecalho)
      .send({ nome: "Maria Silva", email: "u1@exemplo.com", dataNascimento: "1995-04-13", id: "outra-conta" });

    for (const consulta of banco.consultasA("perfis")) {
      expect(consulta.operacoes).toContainEqual({ metodo: "eq", argumentos: ["id", "u1"] });
    }
  });
});
