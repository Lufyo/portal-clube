import { describe, expect, it, vi } from "vitest";
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
    banco.responder("planos", { data: { id: "p2", nome: "Leão Ouro", preco_mensal: 99.9 } });
    banco.responder("perfis", { data: { plano_id: "p1" } }, {});
    banco.responder("mensalidades", {});

    const resposta = await api().post("/api/assinatura").set(cabecalho).send({ planoId: "p2" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ mensagem: "Plano contratado com sucesso", plano: { id: "p2", nome: "Leão Ouro" } });
    for (const consulta of banco.consultasA("perfis")) {
      expect(consulta.operacoes).toContainEqual({ metodo: "eq", argumentos: ["id", "u1"] });
    }
  });

  it("quem assina no dia 24 tem a primeira mensalidade em novembro, sem nada em atraso", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T15:00:00Z"));
    const cabecalho = entrarComo("u1");
    const novembro = {
      id: "m1",
      referencia: "2026-11-01",
      valor: 59.9,
      vencimento: "2026-11-10",
      status: "pendente",
      pago_em: null,
      plano: { nome: "Leão" },
    };

    // Assinatura: plano, perfil sem plano, gravação e primeira cobrança
    banco.responder("planos", { data: { id: "p2", nome: "Leão", preco_mensal: 59.9 } });
    banco.responder("perfis", { data: { plano_id: null } }, {});
    banco.responder("mensalidades", {});
    // Mensalidades: plano do sócio, já existe cobrança futura, lista
    banco.responder("perfis", { data: { plano: { id: "p2", preco_mensal: 59.9 } } });
    banco.responder("mensalidades", { count: 1 }, { data: [novembro] });

    expect((await api().post("/api/assinatura").set(cabecalho).send({ planoId: "p2" })).status).toBe(200);
    const resposta = await api().get("/api/mensalidades").set(cabecalho);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      {
        id: "m1",
        referencia: "2026-11-01",
        plano: "Leão",
        valor: 59.9,
        vencimento: "2026-11-10",
        status: "pendente",
        pagoEm: null,
      },
    ]);
    const upserts = banco
      .consultasA("mensalidades")
      .flatMap((c) => c.operacoes.filter((o) => o.metodo === "upsert"));
    expect(upserts).toHaveLength(1);
    expect(upserts[0].argumentos[0]).toMatchObject({ referencia: "2026-11-01", vencimento: "2026-11-10" });
  });

  it("cancelar antes de pagar e assinar de novo depois do dia 10 não apaga o mês devido", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const cabecalho = entrarComo("u1");
    const plano = { id: "p2", nome: "Leão", preco_mensal: 59.9 };

    // 20/10: cancela. Outubro (já vencido e não pago) é garantido; só meses futuros são apagados
    vi.setSystemTime(new Date("2026-10-20T15:00:00Z"));
    banco.responder("perfis", { data: { plano } }, {});
    banco.responder("mensalidades", { count: 0 }, {}, {});
    expect((await api().delete("/api/assinatura").set(cabecalho)).status).toBe(200);

    // 21/10: assina de novo. Nada é apagado; a primeira cobrança nova é a de novembro
    vi.setSystemTime(new Date("2026-10-21T15:00:00Z"));
    banco.responder("planos", { data: plano });
    banco.responder("perfis", { data: { plano_id: null } }, {});
    banco.responder("mensalidades", {});
    expect((await api().post("/api/assinatura").set(cabecalho).send({ planoId: "p2" })).status).toBe(200);

    const operacoes = banco.consultasA("mensalidades").flatMap((c) => c.operacoes);
    const cobrancas = operacoes.filter((o) => o.metodo === "upsert").map((o) => (o.argumentos[0] as { referencia: string }).referencia);
    expect(cobrancas).toEqual(["2026-10-01", "2026-11-01"]);
    // A única exclusão foi a de meses posteriores a outubro
    const consultasComDelete = banco.consultasA("mensalidades").filter((c) => c.operacoes.some((o) => o.metodo === "delete"));
    expect(consultasComDelete).toHaveLength(1);
    expect(consultasComDelete[0].operacoes).toContainEqual({ metodo: "gt", argumentos: ["referencia", "2026-10-01"] });
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
