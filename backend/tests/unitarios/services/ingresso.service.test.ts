import { describe, expect, it } from "vitest";
import { comprarIngressos, dadosDeCompra, listarIngressos } from "../../../src/services/ingresso.service";
import { banco, filtrosEq } from "../../apoio/supabaseFalso";

const jogoFuturo = {
  id: "j1",
  adversario: "Náutico",
  data_hora: "2999-11-20T19:00:00Z",
  local_jogo: "Ilha do Retiro",
  competicao: "Brasileirão",
  mandante: true,
  gols_clube: null,
};

// Ordem das consultas em dadosDeCompra: jogo → setores, plano do sócio e
// ingressos já comprados por ele → vendidos de cada setor
function prepararCompra({
  jogo = jogoFuturo as unknown,
  setores = [{ id: "s1", nome: "Arquibancada", preco: 60, capacidade: 100 }],
  descontoDoPlano = null as number | null,
  jaComprados = 0,
  vendidosPorSetor = [0],
} = {}) {
  banco.responder("jogos", { data: jogo });
  banco.responder("setores", { data: setores });
  banco.responder("perfis", {
    data: { plano: descontoDoPlano === null ? null : { desconto_ingresso: descontoDoPlano } },
  });
  banco.responder("ingressos", { count: jaComprados }, ...vendidosPorSetor.map((count) => ({ count })));
}

describe("dadosDeCompra", () => {
  it("aplica o desconto do plano e arredonda em centavos", async () => {
    prepararCompra({
      setores: [{ id: "s1", nome: "Cadeira", preco: 59.9, capacidade: 10 }],
      descontoDoPlano: 15,
    });

    const dados = await dadosDeCompra("u1", "j1");

    expect(dados.desconto).toBe(15);
    expect(dados.setores[0]).toMatchObject({ preco: 59.9, precoComDesconto: 50.92 });
  });

  it("sem plano, o preço com desconto é o preço cheio", async () => {
    prepararCompra();
    const dados = await dadosDeCompra("u1", "j1");

    expect(dados.desconto).toBe(0);
    expect(dados.setores[0].precoComDesconto).toBe(60);
  });

  it("calcula lugares disponíveis por setor, nunca abaixo de zero", async () => {
    prepararCompra({
      setores: [
        { id: "s1", nome: "Arquibancada", preco: 60, capacidade: 100 },
        { id: "s2", nome: "Camarote", preco: 200, capacidade: 5 },
      ],
      vendidosPorSetor: [30, 7],
    });

    const dados = await dadosDeCompra("u1", "j1");

    expect(dados.setores.map((s) => s.disponiveis)).toEqual([70, 0]);
    // Cada contagem filtra pelo jogo e pelo setor certo
    const [, ...porSetor] = banco.consultasA("ingressos");
    expect(porSetor.map(filtrosEq)).toEqual([
      { jogo_id: "j1", setor_id: "s1" },
      { jogo_id: "j1", setor_id: "s2" },
    ]);
  });

  it("mostra quantos dos 4 ingressos o sócio ainda pode comprar", async () => {
    prepararCompra({ jaComprados: 3 });
    const dados = await dadosDeCompra("u1", "j1");

    expect(dados.limiteRestante).toBe(1);
    expect(filtrosEq(banco.consultasA("ingressos")[0])).toEqual({ usuario_id: "u1", jogo_id: "j1" });
  });

  it("fecha a venda de jogo que já aconteceu ou já tem resultado", async () => {
    prepararCompra({ jogo: { ...jogoFuturo, data_hora: "2000-01-01T19:00:00Z" } });
    expect((await dadosDeCompra("u1", "j1")).jogo.vendaAberta).toBe(false);

    prepararCompra({ jogo: { ...jogoFuturo, gols_clube: 2 } });
    expect((await dadosDeCompra("u1", "j1")).jogo.vendaAberta).toBe(false);
  });

  it("deixa a venda aberta para jogo futuro sem resultado", async () => {
    prepararCompra();
    expect((await dadosDeCompra("u1", "j1")).jogo.vendaAberta).toBe(true);
  });

  it("responde 404 para jogo inexistente ou id fora do formato UUID", async () => {
    banco.responder("jogos", { data: null }, { data: null, error: { code: "22P02" } });

    await expect(dadosDeCompra("u1", "nao-existe")).rejects.toMatchObject({ status: 404 });
    await expect(dadosDeCompra("u1", "abc")).rejects.toMatchObject({
      status: 404,
      message: "Jogo não encontrado",
    });
  });
});

describe("comprarIngressos", () => {
  const compra = { jogoId: "j1", setorId: "s1", quantidade: 2 };

  it("compra pela função do banco com o id do usuário recebido (o do token)", async () => {
    banco.cliente.rpc.mockResolvedValueOnce({
      data: [
        { id: "i1", codigo: "C1", setor_id: "s1", preco_pago: 0.1, criado_em: "2026-10-24T12:00:00Z" },
        { id: "i2", codigo: "C2", setor_id: "s1", preco_pago: 0.2, criado_em: "2026-10-24T12:00:00Z" },
      ],
      error: null,
    });

    const resultado = await comprarIngressos("u1", compra);

    expect(banco.cliente.rpc).toHaveBeenCalledWith("comprar_ingressos", {
      p_usuario: "u1",
      p_jogo: "j1",
      p_setor: "s1",
      p_quantidade: 2,
    });
    // 0,1 + 0,2 sem o erro de ponto flutuante (0,30000000000000004)
    expect(resultado.total).toBe(0.3);
    expect(resultado.ingressos[0]).toEqual({
      id: "i1",
      codigo: "C1",
      setorId: "s1",
      precoPago: 0.1,
      criadoEm: "2026-10-24T12:00:00Z",
    });
  });

  it.each([
    ["QUANTIDADE_INVALIDA", 400, "Escolha de 1 a 4 ingressos", "quantidade"],
    ["JOGO_NAO_ENCONTRADO", 404, "Jogo não encontrado", undefined],
    ["SETOR_NAO_ENCONTRADO", 404, "Setor não encontrado", "setorId"],
    ["VENDA_ENCERRADA", 409, "A venda de ingressos para este jogo foi encerrada", undefined],
    ["LIMITE_EXCEDIDO", 409, "O limite é de 4 ingressos por jogo", "quantidade"],
    ["SEM_LUGARES", 409, "Não há lugares suficientes neste setor", "setorId"],
  ])("traduz o erro %s do banco", async (codigo, status, mensagem, campo) => {
    banco.cliente.rpc.mockResolvedValueOnce({ data: null, error: { message: `ERRO: ${codigo}` } });

    await expect(comprarIngressos("u1", compra)).rejects.toMatchObject({ status, message: mensagem, campo });
  });

  it("responde 500 para erro desconhecido do banco", async () => {
    banco.cliente.rpc.mockResolvedValueOnce({ data: null, error: { message: "deadlock" } });
    await expect(comprarIngressos("u1", compra)).rejects.toMatchObject({ status: 500 });
  });
});

describe("listarIngressos", () => {
  it("lista só os ingressos do sócio, no formato da API", async () => {
    banco.responder("ingressos", {
      data: [
        {
          id: "i1",
          codigo: "C1",
          preco_pago: 30,
          criado_em: "2026-10-24T12:00:00Z",
          jogo: { ...jogoFuturo },
          setor: { id: "s1", nome: "Arquibancada" },
        },
      ],
    });

    const [ingresso] = await listarIngressos("u1");

    expect(filtrosEq(banco.consultasA("ingressos")[0])).toEqual({ usuario_id: "u1" });
    expect(ingresso).toMatchObject({ setor: "Arquibancada", jogo: { local: "Ilha do Retiro" } });
  });
});
