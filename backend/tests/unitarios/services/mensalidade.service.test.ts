import { describe, expect, it, vi } from "vitest";
import {
  listarMensalidades,
  pagarMensalidade,
  removerMensalidadesPendentes,
} from "../../../src/services/mensalidade.service";
import { banco, filtrosEq } from "../../apoio/supabaseFalso";

const linha = {
  id: "m1",
  referencia: "2026-10-01",
  valor: 59.9,
  vencimento: "2026-10-10",
  status: "pendente",
  pago_em: null,
  plano: { nome: "Leão Prata" },
};

describe("listarMensalidades", () => {
  it("gera a cobrança do mês do plano atual, com vencimento no dia 10", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T15:00:00Z"));
    banco.responder("perfis", { data: { plano: { id: "p1", preco_mensal: 59.9 } } });
    // Nenhuma cobrança de mês seguinte → gera a do mês atual
    banco.responder("mensalidades", { count: 0 }, {}, { data: [linha] });

    await listarMensalidades("u1");

    const [, cobranca] = banco.consultasA("mensalidades");
    const upsert = cobranca.operacoes.find((o) => o.metodo === "upsert")!;
    expect(upsert.argumentos).toEqual([
      { usuario_id: "u1", plano_id: "p1", referencia: "2026-10-01", valor: 59.9, vencimento: "2026-10-10" },
      // Não duplica nem sobrescreve a cobrança do mês
      { onConflict: "usuario_id,referencia", ignoreDuplicates: true },
    ]);
  });

  it("usa o mês do Brasil, não o do servidor em UTC", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 1º de novembro às 01h em UTC ainda é 31 de outubro em São Paulo
    vi.setSystemTime(new Date("2026-11-01T01:00:00Z"));
    banco.responder("perfis", { data: { plano: { id: "p1", preco_mensal: 59.9 } } });
    banco.responder("mensalidades", { count: 0 }, {}, { data: [] });

    await listarMensalidades("u1");

    const upsert = banco.consultasA("mensalidades")[1].operacoes.find((o) => o.metodo === "upsert")!;
    expect(upsert.argumentos[0]).toMatchObject({ referencia: "2026-10-01", vencimento: "2026-10-10" });
  });

  it("quem assinou depois do dia 10 não ganha a cobrança do mês da assinatura", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T15:00:00Z"));
    banco.responder("perfis", { data: { plano: { id: "p1", preco_mensal: 59.9 } } });
    const novembro = { ...linha, referencia: "2026-11-01", vencimento: "2026-11-10" };
    // Já existe a cobrança de novembro, criada na assinatura → outubro não é gerado
    banco.responder("mensalidades", { count: 1 }, { data: [novembro] });

    const lista = await listarMensalidades("u1");

    const [verificacao] = banco.consultasA("mensalidades");
    expect(filtrosEq(verificacao)).toEqual({ usuario_id: "u1" });
    expect(verificacao.operacoes).toContainEqual({ metodo: "gt", argumentos: ["referencia", "2026-10-01"] });
    expect(banco.consultasA("mensalidades").some((c) => c.operacoes.some((o) => o.metodo === "upsert"))).toBe(false);
    expect(lista.map((m) => m.referencia)).toEqual(["2026-11-01"]);
  });

  it("no mês seguinte, a cobrança volta a ser gerada normalmente", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-02T15:00:00Z"));
    banco.responder("perfis", { data: { plano: { id: "p1", preco_mensal: 59.9 } } });
    banco.responder("mensalidades", { count: 0 }, {}, { data: [] });

    await listarMensalidades("u1");

    const upsert = banco.consultasA("mensalidades")[1].operacoes.find((o) => o.metodo === "upsert")!;
    expect(upsert.argumentos[0]).toMatchObject({ referencia: "2026-12-01", vencimento: "2026-12-10" });
  });

  it("falha do banco ao verificar as cobranças futuras é erro do servidor", async () => {
    banco.responder("perfis", { data: { plano: { id: "p1", preco_mensal: 59.9 } } });
    banco.responder("mensalidades", { error: { message: "timeout" } });

    await expect(listarMensalidades("u1")).rejects.toMatchObject({ status: 500 });
  });

  it("sem plano, não gera cobrança e só lista o histórico", async () => {
    banco.responder("perfis", { data: { plano: null } });
    banco.responder("mensalidades", { data: [{ ...linha, status: "paga", pago_em: "2026-09-05T10:00:00Z" }] });

    const lista = await listarMensalidades("u1");

    expect(banco.consultasA("mensalidades")).toHaveLength(1);
    expect(lista).toEqual([
      {
        id: "m1",
        referencia: "2026-10-01",
        plano: "Leão Prata",
        valor: 59.9,
        vencimento: "2026-10-10",
        status: "paga",
        pagoEm: "2026-09-05T10:00:00Z",
      },
    ]);
  });

  it("responde 404 quando o perfil não existe", async () => {
    banco.responder("perfis", { data: null });
    await expect(listarMensalidades("u1")).rejects.toMatchObject({ status: 404 });
  });

  it("falha do banco ao buscar o perfil é erro do servidor, não 'perfil não encontrado'", async () => {
    banco.responder("perfis", { data: null, error: { message: "timeout" } });

    await expect(listarMensalidades("u1")).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível carregar as mensalidades",
    });
  });
});

describe("pagarMensalidade", () => {
  it("só encontra mensalidade do próprio sócio", async () => {
    banco.responder("mensalidades", { data: null });

    await expect(pagarMensalidade("u1", "m-de-outro")).rejects.toMatchObject({
      status: 404,
      message: "Mensalidade não encontrada",
    });
    expect(filtrosEq(banco.consultasA("mensalidades")[0])).toEqual({ id: "m-de-outro", usuario_id: "u1" });
  });

  it("trata id fora do formato UUID como mensalidade não encontrada", async () => {
    banco.responder("mensalidades", { data: null, error: { code: "22P02" } });
    await expect(pagarMensalidade("u1", "abc")).rejects.toMatchObject({ status: 404 });
  });

  it("falha do banco ao buscar a mensalidade é erro do servidor, não 'não encontrada'", async () => {
    banco.responder("mensalidades", { data: null, error: { message: "timeout" } });

    await expect(pagarMensalidade("u1", "m1")).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível registrar o pagamento",
    });
    expect(banco.consultasA("mensalidades")).toHaveLength(1);
  });

  it("não paga duas vezes", async () => {
    banco.responder("mensalidades", { data: { id: "m1", status: "paga" } });
    await expect(pagarMensalidade("u1", "m1")).rejects.toMatchObject({ status: 409 });
  });

  it("registra o pagamento com a data atual", async () => {
    banco.responder("mensalidades", { data: { id: "m1", status: "pendente" } }, {});

    await pagarMensalidade("u1", "m1");

    const atualizacao = banco.consultasA("mensalidades")[1];
    const update = atualizacao.operacoes.find((o) => o.metodo === "update")!;
    expect(update.argumentos[0]).toMatchObject({ status: "paga", pago_em: expect.any(String) });
    expect(filtrosEq(atualizacao)).toEqual({ id: "m1", usuario_id: "u1" });
  });
});

describe("removerMensalidadesPendentes", () => {
  it("apaga só as pendentes do sócio (as pagas ficam como histórico)", async () => {
    banco.responder("mensalidades", {});
    await removerMensalidadesPendentes("u1");

    const consulta = banco.consultasA("mensalidades")[0];
    expect(consulta.operacoes.some((o) => o.metodo === "delete")).toBe(true);
    expect(filtrosEq(consulta)).toEqual({ usuario_id: "u1", status: "pendente" });
  });
});
