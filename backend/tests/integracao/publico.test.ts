import { describe, expect, it } from "vitest";
import { documentoOpenApi } from "../../src/docs/openapi";
import { loginSchema, registerSchema } from "../../src/schemas/auth.schema";
import { compraSchema } from "../../src/schemas/ingresso.schema";
import { noticiaSchema } from "../../src/schemas/noticia.schema";
import { api } from "../apoio/api";
import { banco } from "../apoio/supabaseFalso";

describe("conteúdo público", () => {
  it("GET /api/noticias/:id responde 404 para rascunho", async () => {
    banco.responder("noticias", { data: null });

    const resposta = await api().get("/api/noticias/n1");

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Notícia não encontrada" });
  });

  it("GET /api/jogos responde 500 com mensagem clara quando o banco falha", async () => {
    banco.responder("jogos", { error: { message: "timeout" } });

    const resposta = await api().get("/api/jogos");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "Não foi possível carregar os jogos" });
  });
});

describe("GET /api/health", () => {
  it("responde ok quando o banco responde", async () => {
    banco.responder("perfis", { count: 1 });
    const resposta = await api().get("/api/health");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: "ok", banco: "conectado" });
  });

  it("responde 500 quando o banco está fora do ar", async () => {
    banco.responder("perfis", { error: { message: "sem conexão" } });
    const resposta = await api().get("/api/health");

    expect(resposta.status).toBe(500);
    expect(resposta.body.status).toBe("erro");
  });
});

describe("CORS", () => {
  it("libera o frontend local", async () => {
    banco.responder("planos", { data: [] });
    const resposta = await api().get("/api/planos").set("Origin", "http://localhost:5173");

    expect(resposta.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("não libera outras origens", async () => {
    banco.responder("planos", { data: [] });
    const resposta = await api().get("/api/planos").set("Origin", "https://site-qualquer.com");

    expect(resposta.headers["access-control-allow-origin"]).not.toBe("https://site-qualquer.com");
  });
});

describe("documentação da API", () => {
  it("serve o OpenAPI em /api/openapi.json e o Swagger em /api/docs", async () => {
    const json = await api().get("/api/openapi.json");
    expect(json.status).toBe(200);
    expect(json.body.openapi).toBe("3.1.0");

    const tela = await api().get("/api/docs/");
    expect(tela.status).toBe(200);
    expect(tela.text).toContain("swagger-ui");
  });

  it("documenta as 22 operações da API", () => {
    const operacoes = Object.values(documentoOpenApi.paths).flatMap((caminho) => Object.keys(caminho));
    expect(operacoes).toHaveLength(22);
  });

  // Exemplo do Swagger que a própria API recusaria engana quem usa a documentação
  it.each([
    ["/auth/register", "post", registerSchema],
    ["/auth/login", "post", loginSchema],
    ["/ingressos", "post", compraSchema],
    ["/admin/noticias", "post", noticiaSchema],
  ] as const)("o exemplo de %s passa na validação da API", (caminho, metodo, schema) => {
    const caminhos = documentoOpenApi.paths as unknown as Record<
      string,
      Record<string, { requestBody: { content: { "application/json": { example: unknown } } } }>
    >;
    const operacao = caminhos[caminho][metodo];
    const exemplo = operacao.requestBody.content["application/json"].example;

    expect(schema.safeParse(exemplo).success).toBe(true);
  });
});
