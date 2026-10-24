import { describe, expect, it } from "vitest";
import { api, entrarComo } from "../apoio/api";
import { banco } from "../apoio/supabaseFalso";

// Respostas de erro como o site e o Swagger as recebem

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
