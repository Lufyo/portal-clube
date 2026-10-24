import { describe, expect, it, vi } from "vitest";
import { excluirConta, exportarDados } from "../../../src/services/lgpd.service";
import { banco, filtrosEq } from "../../apoio/supabaseFalso";

// Conferência da senha: o Supabase Auth aceita ou recusa o login
function senha(correta: boolean) {
  banco.cliente.auth.signInWithPassword.mockResolvedValueOnce(
    correta
      ? { data: { session: { access_token: "t" }, user: { id: "u1" } }, error: null }
      : { data: { session: null, user: null }, error: { message: "Invalid login credentials" } }
  );
}

const jogo = (dataHora: string) => ({
  adversario: "Náutico",
  data_hora: dataHora,
  local_jogo: "Ilha do Retiro",
  competicao: "Série A",
});

describe("exportarDados (LGPD: acesso e portabilidade)", () => {
  it("reúne os dados pessoais, o plano, as mensalidades e os ingressos do próprio sócio", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T15:00:00Z"));
    banco.responder("perfis", {
      data: {
        nome: "Maria Silva",
        cpf: "52998224725",
        data_nascimento: "1995-04-13",
        numero_socio: 42,
        papel: "socio",
        criado_em: "2026-01-02T10:00:00Z",
        plano: { nome: "Leão", preco_mensal: 59.9 },
      },
    });
    banco.responder("mensalidades", {
      data: [
        { referencia: "2026-10-01", valor: 59.9, vencimento: "2026-10-10", status: "paga", pago_em: "2026-10-05T12:00:00Z", plano: { nome: "Leão" } },
      ],
    });
    banco.responder("ingressos", {
      data: [
        { codigo: "C1", preco_pago: 45, criado_em: "2026-10-20T12:00:00Z", jogo: jogo("2026-10-28T23:00:00Z"), setor: { nome: "Arquibancada" } },
      ],
    });

    const dados = await exportarDados("u1", "maria@exemplo.com");

    expect(dados).toEqual({
      geradoEm: "2026-10-24T15:00:00.000Z",
      titular: {
        nome: "Maria Silva",
        email: "maria@exemplo.com",
        cpf: "52998224725",
        dataNascimento: "1995-04-13",
        numeroSocio: 42,
        perfil: "socio",
        cadastradoEm: "2026-01-02T10:00:00Z",
      },
      plano: { nome: "Leão", precoMensal: 59.9 },
      mensalidades: [
        { referencia: "2026-10-01", plano: "Leão", valor: 59.9, vencimento: "2026-10-10", status: "paga", pagoEm: "2026-10-05T12:00:00Z" },
      ],
      ingressos: [
        {
          codigo: "C1",
          jogo: "Sport x Náutico",
          data: "2026-10-28T23:00:00Z",
          local: "Ilha do Retiro",
          competicao: "Série A",
          setor: "Arquibancada",
          valorPago: 45,
          compradoEm: "2026-10-20T12:00:00Z",
        },
      ],
    });
    expect(filtrosEq(banco.consultasA("perfis")[0])).toEqual({ id: "u1" });
    expect(filtrosEq(banco.consultasA("mensalidades")[0])).toEqual({ usuario_id: "u1" });
    expect(filtrosEq(banco.consultasA("ingressos")[0])).toEqual({ usuario_id: "u1" });
  });

  it("falha do banco é erro do servidor", async () => {
    banco.responder("perfis", { error: { message: "timeout" } });
    banco.responder("mensalidades", { data: [] });
    banco.responder("ingressos", { data: [] });

    await expect(exportarDados("u1", "maria@exemplo.com")).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível reunir seus dados",
    });
  });
});

describe("excluirConta (LGPD: eliminação)", () => {
  const pedido = { senhaAtual: "leao1905" };

  // Sem pendências: nenhuma mensalidade devida e nenhum ingresso para jogo futuro
  function semPendencias() {
    banco.responder("mensalidades", { count: 0 });
    banco.responder("ingressos", { data: [{ jogo: jogo("2026-01-10T23:00:00Z") }] });
  }

  it("com a senha errada, não verifica nem apaga nada", async () => {
    senha(false);

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).rejects.toMatchObject({
      status: 400,
      campo: "senhaAtual",
      message: "Senha incorreta",
    });
    expect(banco.consultas).toHaveLength(0);
    expect(banco.cliente.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("procura mensalidades devidas só até o mês atual", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T15:00:00Z"));
    senha(true);
    banco.responder("mensalidades", { count: 1 });
    banco.responder("ingressos", { data: [] });

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).rejects.toMatchObject({ status: 409 });

    const [dividas] = banco.consultasA("mensalidades");
    expect(filtrosEq(dividas)).toEqual({ usuario_id: "u1", status: "pendente" });
    expect(dividas.operacoes).toContainEqual({ metodo: "lte", argumentos: ["referencia", "2026-10-01"] });
  });

  it.each([
    [1, [], "Para excluir a conta, pague a mensalidade em aberto."],
    [3, [], "Para excluir a conta, pague as 3 mensalidades em aberto."],
    [0, ["2999-01-01T20:00:00Z"], "Para excluir a conta, aguarde o jogo com ingresso comprado."],
    [
      2,
      ["2999-01-01T20:00:00Z", "2999-02-01T20:00:00Z"],
      "Para excluir a conta, pague as 2 mensalidades em aberto e aguarde os 2 jogos com ingresso comprado.",
    ],
  ])("com pendências (%s mensalidades, %j), bloqueia e explica o que falta", async (dividas, jogosFuturos, mensagem) => {
    senha(true);
    banco.responder("mensalidades", { count: dividas });
    banco.responder("ingressos", { data: jogosFuturos.map((d) => ({ jogo: jogo(d) })) });

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).rejects.toMatchObject({ status: 409, message: mensagem });
    expect(banco.consultasA("perfis")).toHaveLength(0);
    expect(banco.cliente.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("ingresso de jogo que já aconteceu não impede a exclusão", async () => {
    senha(true);
    semPendencias();
    banco.responder("mensalidades", {});
    banco.responder("perfis", {});
    banco.cliente.auth.admin.deleteUser.mockResolvedValueOnce({ data: {}, error: null });

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).resolves.toBeUndefined();
  });

  it("sem pendências: apaga cobranças futuras, anonimiza o perfil e exclui o login", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T15:00:00Z"));
    senha(true);
    semPendencias();
    banco.responder("mensalidades", {});
    banco.responder("perfis", {});
    banco.cliente.auth.admin.deleteUser.mockResolvedValueOnce({ data: {}, error: null });

    await excluirConta("u1", "maria@exemplo.com", pedido);

    // Cobranças de meses que ainda não começaram deixam de existir
    const futuras = banco.consultasA("mensalidades")[1];
    expect(futuras.operacoes.some((o) => o.metodo === "delete")).toBe(true);
    expect(futuras.operacoes).toContainEqual({ metodo: "gt", argumentos: ["referencia", "2026-10-01"] });

    // O perfil fica, sem nenhum dado pessoal, para o histórico financeiro
    const [anonimizacao] = banco.consultasA("perfis");
    expect(anonimizacao.operacoes.find((o) => o.metodo === "update")!.argumentos[0]).toEqual({
      nome: "Sócio removido",
      cpf: "removido-u1",
      data_nascimento: "1900-01-01",
      plano_id: null,
    });
    expect(filtrosEq(anonimizacao)).toEqual({ id: "u1" });
    expect(anonimizacao.operacoes.some((o) => o.metodo === "delete")).toBe(false);

    // Exclusão suave do login: apaga o e-mail e impede o acesso, sem apagar o histórico
    expect(banco.cliente.auth.admin.deleteUser).toHaveBeenCalledWith("u1", true);
  });

  it("se anonimizar falhar, o login não é excluído (a pessoa pode tentar de novo)", async () => {
    senha(true);
    semPendencias();
    banco.responder("mensalidades", {});
    banco.responder("perfis", { error: { message: "timeout" } });

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).rejects.toMatchObject({ status: 500 });
    expect(banco.cliente.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("falha do Auth ao excluir o login é erro do servidor", async () => {
    senha(true);
    semPendencias();
    banco.responder("mensalidades", {});
    banco.responder("perfis", {});
    banco.cliente.auth.admin.deleteUser.mockResolvedValueOnce({ data: null, error: { message: "timeout" } });

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível excluir a conta",
    });
  });

  it("falha do banco ao verificar as pendências é erro do servidor", async () => {
    senha(true);
    banco.responder("mensalidades", { error: { message: "timeout" } });
    banco.responder("ingressos", { data: [] });

    await expect(excluirConta("u1", "maria@exemplo.com", pedido)).rejects.toMatchObject({ status: 500 });
    expect(banco.cliente.auth.admin.deleteUser).not.toHaveBeenCalled();
  });
});
