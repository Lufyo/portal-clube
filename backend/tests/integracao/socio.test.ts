import { describe, expect, it } from "vitest";
import { api, entrarComo } from "../apoio/api";
import { banco } from "../apoio/supabaseFalso";

describe("planos e assinatura", () => {
  it("GET /api/planos é público", async () => {
    banco.responder("planos", {
      data: [{ id: "p1", nome: "Leão", preco_mensal: 29.9, beneficios: [], destaque: true }],
    });

    const resposta = await api().get("/api/planos");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([{ id: "p1", nome: "Leão", preco: 29.9, beneficios: [], destaque: true }]);
  });

  it("POST /api/assinatura valida o corpo antes de consultar o banco", async () => {
    const resposta = await api().post("/api/assinatura").set(entrarComo("u1")).send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe("Dados inválidos");
    expect(resposta.body.campos).toHaveProperty("planoId");
  });

  it("POST /api/assinatura contrata o plano para o dono do token", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("planos", { data: { id: "p2", nome: "Leão Ouro" } });
    banco.responder("perfis", {});
    banco.responder("mensalidades", {});

    const resposta = await api().post("/api/assinatura").set(cabecalho).send({ planoId: "p2" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ mensagem: "Plano contratado com sucesso", plano: { id: "p2", nome: "Leão Ouro" } });
    expect(banco.consultasA("perfis")[0].operacoes).toContainEqual({ metodo: "eq", argumentos: ["id", "u1"] });
  });
});

describe("mensalidades", () => {
  it("POST /api/mensalidades/:id/pagar responde 409 para mensalidade já paga", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("mensalidades", { data: { id: "m1", status: "paga" } });

    const resposta = await api().post("/api/mensalidades/m1/pagar").set(cabecalho);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "Esta mensalidade já foi paga" });
  });

  it("POST /api/mensalidades/:id/pagar registra o pagamento", async () => {
    const cabecalho = entrarComo("u1");
    banco.responder("mensalidades", { data: { id: "m1", status: "pendente" } }, {});

    const resposta = await api().post("/api/mensalidades/m1/pagar").set(cabecalho);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ mensagem: "Mensalidade paga com sucesso" });
  });
});

describe("ingressos", () => {
  const compra = { jogoId: "j1", setorId: "s1", quantidade: 2 };

  it("POST /api/ingressos usa o id do token, nunca um id enviado no corpo", async () => {
    const cabecalho = entrarComo("u1");
    banco.cliente.rpc.mockResolvedValueOnce({
      data: [{ id: "i1", codigo: "C1", setor_id: "s1", preco_pago: 30, criado_em: "2026-10-24T12:00:00Z" }],
      error: null,
    });

    const resposta = await api()
      .post("/api/ingressos")
      .set(cabecalho)
      .send({ ...compra, usuarioId: "outro-socio" });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ mensagem: "Compra realizada com sucesso", total: 30 });
    expect(banco.cliente.rpc).toHaveBeenCalledWith("comprar_ingressos", expect.objectContaining({ p_usuario: "u1" }));
  });

  it("POST /api/ingressos recusa mais de 4 ingressos antes de chamar o banco", async () => {
    const resposta = await api().post("/api/ingressos").set(entrarComo("u1")).send({ ...compra, quantidade: 5 });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ quantidade: "O limite é de 4 ingressos por compra" });
    expect(banco.cliente.rpc).not.toHaveBeenCalled();
  });

  it("POST /api/ingressos devolve o erro do banco no campo certo", async () => {
    const cabecalho = entrarComo("u1");
    banco.cliente.rpc.mockResolvedValueOnce({ data: null, error: { message: "LIMITE_EXCEDIDO" } });

    const resposta = await api().post("/api/ingressos").set(cabecalho).send(compra);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      erro: "O limite é de 4 ingressos por jogo",
      campos: { quantidade: "O limite é de 4 ingressos por jogo" },
    });
  });
});
