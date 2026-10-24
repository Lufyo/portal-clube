import { describe, expect, it } from "vitest";
import { api, entrarComo } from "../apoio/api";
import { banco } from "../apoio/supabaseFalso";

// Respostas de erro como o site e o Swagger as recebem

describe("toda resposta de erro vem em JSON, no formato { erro }", () => {
  it("JSON malformado responde 400 com mensagem clara", async () => {
    const resposta = await api()
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "maria@exemplo.com", ');

    expect(resposta.status).toBe(400);
    expect(resposta.headers["content-type"]).toMatch(/application\/json/);
    expect(resposta.body).toEqual({ erro: "Os dados enviados não estão em um formato JSON válido" });
  });

  it("corpo grande demais responde 413 em JSON", async () => {
    const resposta = await api()
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a@b.com", senha: "x".repeat(200_000) }));

    expect(resposta.status).toBe(413);
    expect(resposta.headers["content-type"]).toMatch(/application\/json/);
    expect(resposta.body).toEqual({ erro: "Os dados enviados são grandes demais" });
  });

  it("outro problema ao ler o corpo mantém o código 4xx, em JSON (não vira 500)", async () => {
    const resposta = await api()
      .post("/api/auth/login")
      .set("Content-Type", "application/json; charset=latin9")
      .send('{"email":"a@b.com","senha":"x"}');

    expect(resposta.status).toBe(415);
    expect(resposta.body).toEqual({ erro: "Não foi possível ler os dados enviados" });
  });

  it("rota da API que não existe responde 404 em JSON", async () => {
    const resposta = await api().get("/api/rota-que-nao-existe");

    expect(resposta.status).toBe(404);
    expect(resposta.headers["content-type"]).toMatch(/application\/json/);
    expect(resposta.body).toEqual({ erro: "Rota não encontrada" });
  });

  it("método que a rota não aceita também responde 404 em JSON", async () => {
    const resposta = await api().put("/api/planos");

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Rota não encontrada" });
  });

  it("a documentação continua no ar", async () => {
    expect((await api().get("/api/docs/")).status).toBe(200);
    expect((await api().get("/api/openapi.json")).status).toBe(200);
  });
});

describe("requisição sem os dados", () => {
  it("login sem corpo diz o que falta, em português", async () => {
    const resposta = await api().post("/api/auth/login");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "Dados inválidos",
      campos: { email: "Informe seu e-mail", senha: "Informe a senha" },
    });
  });

  it("cadastro com corpo vazio diz o que falta em cada campo", async () => {
    const resposta = await api().post("/api/auth/register").send({});

    expect(resposta.status).toBe(400);
    expect(Object.keys(resposta.body.campos).sort()).toEqual(
      ["cpf", "dataNascimento", "email", "nome", "senha"].sort()
    );
  });

  it("corpo que não é um objeto não gera um campo 'undefined'", async () => {
    const resposta = await api().post("/api/auth/login").send([1, 2]);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe("Dados inválidos");
    expect(resposta.body.campos).not.toHaveProperty("undefined");
  });

  it("cadastro recusa CPF com letras", async () => {
    const resposta = await api().post("/api/auth/register").send({
      nome: "Maria Leão da Silva",
      email: "maria@exemplo.com",
      cpf: "529.982.247-25abc",
      dataNascimento: "1995-04-13",
      senha: "leao1905",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ cpf: "CPF inválido" });
    expect(banco.cliente.auth.admin.createUser).not.toHaveBeenCalled();
  });
});

describe("banco fora do ar não se disfarça de outro erro", () => {
  const falha = { data: null, error: { message: "timeout" } };

  it("GET /api/auth/me responde 500, não 'perfil não encontrado'", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", falha);

    const resposta = await api().get("/api/auth/me").set(cabecalho);

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "Não foi possível carregar o perfil" });
  });

  it("GET /api/mensalidades responde 500, não 'perfil não encontrado'", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", falha);

    const resposta = await api().get("/api/mensalidades").set(cabecalho);

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "Não foi possível carregar as mensalidades" });
  });

  it("POST /api/mensalidades/:id/pagar responde 500, não 'mensalidade não encontrada'", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("mensalidades", falha);

    const resposta = await api().post("/api/mensalidades/m1/pagar").set(cabecalho);

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "Não foi possível registrar o pagamento" });
  });

  it("POST /api/assinatura responde 500, não 'plano não encontrado'", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("planos", falha);

    const resposta = await api().post("/api/assinatura").set(cabecalho).send({ planoId: "p1" });

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "Não foi possível contratar o plano" });
  });

  it("rota do painel responde 500, não 'acesso negado'", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("perfis", falha);

    const resposta = await api().get("/api/admin/resumo").set(cabecalho);

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "Não foi possível verificar suas permissões" });
  });
});
