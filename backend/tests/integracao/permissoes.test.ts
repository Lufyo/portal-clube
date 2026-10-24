import { describe, expect, it } from "vitest";
import { api, entrarComo } from "../apoio/api";
import { banco } from "../apoio/supabaseFalso";

// Matriz de acesso do escopo: quem pode o quê no painel.
// O admin sempre pode; a tela só esconde, quem decide é a API.

function responderResumo() {
  banco.responder("perfis", { count: 10 }, { count: 5 });
  banco.responder("mensalidades", { count: 1 });
  banco.responder("noticias", { count: 2 });
  banco.responder("jogos", { count: 3 });
}

describe("GET /api/admin/resumo (editor, gestor e admin)", () => {
  it("responde 401 sem login", async () => {
    expect((await api().get("/api/admin/resumo")).status).toBe(401);
  });

  it("responde 403 para sócio", async () => {
    const resposta = await api().get("/api/admin/resumo").set(entrarComo("u1", "socio"));
    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual({ erro: "Acesso negado" });
  });

  it.each(["editor", "gestor", "admin"] as const)("libera para %s", async (papel) => {
    const cabecalho = entrarComo("u1", papel);
    responderResumo();

    const resposta = await api().get("/api/admin/resumo").set(cabecalho);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      cadastros: 10,
      sociosComPlano: 5,
      mensalidadesPendentes: 1,
      noticiasPublicadas: 2,
      jogos: 3,
    });
  });
});

describe("gestão de notícias (editor e admin)", () => {
  it.each(["socio", "gestor"] as const)("bloqueia %s em todas as rotas", async (papel) => {
    const rotas = [
      api().get("/api/admin/noticias"),
      api().post("/api/admin/noticias").send({}),
      api().put("/api/admin/noticias/n1").send({}),
      api().patch("/api/admin/noticias/n1/publicacao").send({ publicada: true }),
      api().delete("/api/admin/noticias/n1"),
    ];
    for (const requisicao of rotas) {
      const resposta = await requisicao.set(entrarComo("u1", papel));
      expect(resposta.status).toBe(403);
    }
  });

  it.each(["editor", "admin"] as const)("libera para %s", async (papel) => {
    const cabecalho = entrarComo("u1", papel);
    banco.responder("noticias", { data: [] });

    const resposta = await api().get("/api/admin/noticias").set(cabecalho);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });
});

describe("rotas do sócio exigem login", () => {
  it.each([
    ["get", "/api/mensalidades"],
    ["post", "/api/mensalidades/m1/pagar"],
    ["post", "/api/assinatura"],
    ["delete", "/api/assinatura"],
    ["get", "/api/ingressos"],
    ["post", "/api/ingressos"],
    ["get", "/api/ingressos/jogos/j1"],
  ] as const)("%s %s responde 401 sem token", async (metodo, rota) => {
    const resposta = await api()[metodo](rota);
    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ erro: "Token não informado" });
  });

  it("token inválido também responde 401", async () => {
    const resposta = await api().get("/api/mensalidades").set({ Authorization: "Bearer inventado" });
    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ erro: "Token inválido ou expirado" });
  });
});
