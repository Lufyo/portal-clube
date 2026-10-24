import { describe, expect, it } from "vitest";
import { obterResumo } from "../../../src/services/admin.service";
import { listarJogos } from "../../../src/services/jogo.service";
import {
  alterarPublicacao,
  atualizarNoticia,
  criarNoticia,
  excluirNoticia,
} from "../../../src/services/noticia-admin.service";
import { buscarNoticiaPublica, listarNoticias } from "../../../src/services/noticia.service";
import { cancelarPlano, contratarPlano, listarPlanos } from "../../../src/services/plano.service";
import { banco, filtrosEq } from "../../apoio/supabaseFalso";

const operacao = (tabela: string, indice: number, metodo: string) =>
  banco.consultasA(tabela)[indice].operacoes.find((o) => o.metodo === metodo);

describe("plano.service", () => {
  it("lista só os planos ativos, com 'preco' no lugar de 'preco_mensal'", async () => {
    banco.responder("planos", {
      data: [{ id: "p1", nome: "Leão", preco_mensal: 29.9, beneficios: ["Carteira"], destaque: false }],
    });

    expect(await listarPlanos()).toEqual([
      { id: "p1", nome: "Leão", preco: 29.9, beneficios: ["Carteira"], destaque: false },
    ]);
    expect(filtrosEq(banco.consultasA("planos")[0])).toEqual({ ativo: true });
  });

  it("não contrata plano inexistente ou inativo", async () => {
    banco.responder("planos", { data: null });
    await expect(contratarPlano("u1", "p9")).rejects.toMatchObject({ status: 404, campo: "planoId" });
  });

  it("contratar grava o plano no perfil e apaga as cobranças pendentes do plano antigo", async () => {
    banco.responder("planos", { data: { id: "p2", nome: "Leão Ouro" } });
    banco.responder("perfis", {});
    banco.responder("mensalidades", {});

    expect(await contratarPlano("u1", "p2")).toEqual({ id: "p2", nome: "Leão Ouro" });
    expect(operacao("perfis", 0, "update")!.argumentos[0]).toEqual({ plano_id: "p2" });
    expect(filtrosEq(banco.consultasA("mensalidades")[0])).toEqual({ usuario_id: "u1", status: "pendente" });
  });

  it("cancelar tira o plano e apaga as cobranças pendentes", async () => {
    banco.responder("perfis", {});
    banco.responder("mensalidades", {});

    await cancelarPlano("u1");

    expect(operacao("perfis", 0, "update")!.argumentos[0]).toEqual({ plano_id: null });
  });
});

describe("jogo.service", () => {
  it("só inclui 'resultado' em jogo já disputado", async () => {
    const base = { adversario: "Náutico", data_hora: "2026-10-01T19:00:00Z", local_jogo: "Ilha", competicao: "Série A", mandante: true };
    banco.responder("jogos", {
      data: [
        { ...base, id: "j1", gols_clube: 2, gols_adversario: 0 },
        { ...base, id: "j2", gols_clube: null, gols_adversario: null },
      ],
    });

    const [disputado, futuro] = await listarJogos();

    expect(disputado.resultado).toEqual({ golsClube: 2, golsAdversario: 0 });
    expect(futuro).not.toHaveProperty("resultado.golsClube");
    expect(JSON.parse(JSON.stringify(futuro))).not.toHaveProperty("resultado");
  });
});

describe("noticia.service (área pública)", () => {
  it("lista só as publicadas, das mais recentes para as mais antigas", async () => {
    banco.responder("noticias", { data: [] });
    await listarNoticias();

    const consulta = banco.consultasA("noticias")[0];
    expect(filtrosEq(consulta)).toEqual({ publicada: true });
    expect(consulta.operacoes.find((o) => o.metodo === "order")!.argumentos).toEqual([
      "publicada_em",
      { ascending: false },
    ]);
  });

  it("trata rascunho e id fora do formato UUID como 'não encontrada'", async () => {
    banco.responder("noticias", { data: null }, { data: null, error: { code: "22P02" } });

    await expect(buscarNoticiaPublica("rascunho")).rejects.toMatchObject({ status: 404 });
    await expect(buscarNoticiaPublica("abc")).rejects.toMatchObject({ status: 404 });
  });
});

describe("noticia-admin.service", () => {
  const dados = {
    titulo: "Título da notícia",
    resumo: "Resumo da notícia",
    conteudo: "Conteúdo completo da notícia",
    categoria: "Profissional masculino" as const,
    tipo: "Notícia" as const,
  };
  const linha = (publicada: boolean) => ({
    id: "n1",
    ...dados,
    publicada,
    publicada_em: publicada ? "2026-10-24T12:00:00Z" : null,
    criado_em: "2026-10-20T12:00:00Z",
  });

  it("rascunho nasce sem data de publicação", async () => {
    banco.responder("noticias", { data: linha(false) });
    await criarNoticia({ ...dados, publicada: false });

    expect(operacao("noticias", 0, "insert")!.argumentos[0]).not.toHaveProperty("publicada_em");
  });

  it("notícia criada já publicada recebe a data de publicação", async () => {
    banco.responder("noticias", { data: linha(true) });
    const noticia = await criarNoticia({ ...dados, publicada: true });

    expect(operacao("noticias", 0, "insert")!.argumentos[0]).toHaveProperty("publicada_em", expect.any(String));
    expect(noticia).toMatchObject({ id: "n1", publicada: true, publicadaEm: "2026-10-24T12:00:00Z" });
  });

  it("publicar um rascunho grava a data de publicação", async () => {
    banco.responder("noticias", { data: linha(false) }, { data: linha(true) });
    await alterarPublicacao("n1", true);

    expect(operacao("noticias", 1, "update")!.argumentos[0]).toEqual({
      publicada: true,
      publicada_em: expect.any(String),
    });
  });

  it("editar notícia já publicada mantém a data de publicação original", async () => {
    banco.responder("noticias", { data: linha(true) }, { data: linha(true) });
    await atualizarNoticia("n1", { ...dados, publicada: true });

    expect(operacao("noticias", 1, "update")!.argumentos[0]).not.toHaveProperty("publicada_em");
  });

  it("não edita notícia inexistente", async () => {
    banco.responder("noticias", { data: null });
    await expect(alterarPublicacao("n9", true)).rejects.toMatchObject({ status: 404 });
  });

  it("não exclui notícia inexistente", async () => {
    banco.responder("noticias", { data: [] });
    await expect(excluirNoticia("n9")).rejects.toMatchObject({ status: 404 });
  });
});

describe("admin.service", () => {
  it("devolve só contagens, sem dados pessoais", async () => {
    banco.responder("perfis", { count: 120 }, { count: 80 });
    banco.responder("mensalidades", { count: 15 });
    banco.responder("noticias", { count: 9 });
    banco.responder("jogos", { count: 12 });

    expect(await obterResumo()).toEqual({
      cadastros: 120,
      sociosComPlano: 80,
      mensalidadesPendentes: 15,
      noticiasPublicadas: 9,
      jogos: 12,
    });
  });
});
