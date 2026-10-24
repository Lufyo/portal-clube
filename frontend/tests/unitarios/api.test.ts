import { describe, expect, it } from "vitest";
import { api, ApiError, guardarToken, lerToken, removerToken } from "../../src/services/api";
import { apiFalsa } from "../apoio/apiFalsa";

describe("api()", () => {
  it("envia o token salvo no cabeçalho Authorization", async () => {
    guardarToken("abc");
    apiFalsa.responder("GET", "/mensalidades", 200, []);

    await api("/mensalidades");

    expect(apiFalsa.chamadas[0].cabecalhos).toEqual({ Authorization: "Bearer abc" });
  });

  it("sem token, não envia Authorization", async () => {
    apiFalsa.responder("GET", "/planos", 200, []);
    await api("/planos");

    expect(apiFalsa.chamadas[0].cabecalhos).toEqual({});
  });

  it("envia o corpo em JSON, com o Content-Type", async () => {
    apiFalsa.responder("POST", "/auth/login", 200, { token: "t" });
    await api("/auth/login", { metodo: "POST", corpo: { email: "a@b.com", senha: "x" } });

    const [chamada] = apiFalsa.chamadas;
    expect(chamada.cabecalhos).toEqual({ "Content-Type": "application/json" });
    expect(chamada.corpo).toEqual({ email: "a@b.com", senha: "x" });
  });

  it("transforma a resposta de erro em ApiError, com a mensagem, o status e os campos", async () => {
    apiFalsa.responder("POST", "/auth/register", 409, { erro: "CPF já cadastrado", campos: { cpf: "CPF já cadastrado" } });

    const erro = await api("/auth/register", { metodo: "POST", corpo: {} }).catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ message: "CPF já cadastrado", status: 409, campos: { cpf: "CPF já cadastrado" } });
  });

  it("com servidor fora do ar, a mensagem é clara (RNF06)", async () => {
    apiFalsa.falharRede("GET", "/jogos");

    await expect(api("/jogos")).rejects.toMatchObject({
      message: "Não foi possível conectar ao servidor. Tente novamente.",
      status: 0,
    });
  });
});

describe("token no navegador", () => {
  it("guarda, lê e remove o token", () => {
    guardarToken("abc");
    expect(lerToken()).toBe("abc");

    removerToken();
    expect(lerToken()).toBeNull();
  });
});
