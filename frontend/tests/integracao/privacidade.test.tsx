import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Perfil } from "../../src/types/auth";
import { apiFalsa } from "../apoio/apiFalsa";
import { abrirApp, jaLogadoComo } from "../apoio/renderizar";

const perfil: Perfil = {
  id: "u1",
  nome: "Maria Silva",
  cpf: "52998224725",
  dataNascimento: "1995-04-13",
  numeroSocio: 42,
  papel: "socio",
  email: "maria@exemplo.com",
  plano: null,
};

async function abrirMinhaArea() {
  jaLogadoComo("socio");
  apiFalsa.responder("GET", "/auth/me", 200, perfil);
  apiFalsa.responder("GET", "/planos", 200, []);
  abrirApp("/minha-area");
  await screen.findByRole("heading", { name: "Privacidade e dados" });
  return userEvent.setup();
}

const secao = () => screen.getByRole("region", { name: "Privacidade e dados" });

describe("baixar meus dados (LGPD)", () => {
  it("baixa um arquivo JSON com o que a API devolveu", async () => {
    const usuario = await abrirMinhaArea();
    const dados = { geradoEm: "2026-10-24T15:00:00Z", titular: { nome: "Maria Silva" }, mensalidades: [], ingressos: [] };
    apiFalsa.responder("GET", "/auth/me/dados", 200, dados);

    // O jsdom não baixa arquivos: guarda o que seria baixado
    let arquivo: Blob | undefined;
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn((blob: Blob) => {
        arquivo = blob;
        return "blob:meus-dados";
      }),
      revokeObjectURL: vi.fn(),
    }));
    const cliques: HTMLAnchorElement[] = [];
    const clicar = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      cliques.push(this);
    });

    await usuario.click(within(secao()).getByRole("button", { name: "Baixar meus dados" }));

    expect(await within(secao()).findByRole("status")).toHaveTextContent("Seus dados foram baixados");
    expect(clicar).toHaveBeenCalledOnce();
    expect(cliques[0].download).toBe("meus-dados-portal-sport-club.json");
    expect(arquivo!.type).toBe("application/json");
    expect(JSON.parse(await arquivo!.text())).toEqual(dados);
  });

  it("falha ao reunir os dados aparece na tela", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("GET", "/auth/me/dados", 500, { erro: "Não foi possível reunir seus dados" });

    await usuario.click(within(secao()).getByRole("button", { name: "Baixar meus dados" }));

    expect(await within(secao()).findByRole("alert")).toHaveTextContent("Não foi possível reunir seus dados");
  });
});

describe("excluir minha conta (LGPD)", () => {
  async function pedirExclusao(usuario: ReturnType<typeof userEvent.setup>, senha: string) {
    await usuario.click(within(secao()).getByRole("button", { name: "Excluir minha conta" }));
    await usuario.type(within(secao()).getByLabelText("Senha atual"), senha);
    await usuario.click(within(secao()).getByRole("button", { name: "Excluir conta definitivamente" }));
  }

  it("explica o que acontece antes de pedir a senha", async () => {
    const usuario = await abrirMinhaArea();

    await usuario.click(within(secao()).getByRole("button", { name: "Excluir minha conta" }));

    const texto = secao().textContent!;
    expect(texto).toMatch(/não pode ser desfeita/);
    expect(texto).toMatch(/histórico de mensalidades e ingressos/);
  });

  it("com pendências, mostra o que falta e continua logado", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("DELETE", "/auth/me", 409, {
      erro: "Para excluir a conta, pague a mensalidade em aberto.",
    });

    await pedirExclusao(usuario, "leao1905");

    expect(await within(secao()).findByRole("alert")).toHaveTextContent(
      "Para excluir a conta, pague a mensalidade em aberto."
    );
    expect(localStorage.getItem("portal_token")).toBe("token-salvo");
    expect(apiFalsa.chamadasA("DELETE", "/auth/me")[0].corpo).toEqual({ senhaAtual: "leao1905" });
  });

  it("senha errada aparece no campo", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("DELETE", "/auth/me", 400, { erro: "Senha incorreta", campos: { senhaAtual: "Senha incorreta" } });

    await pedirExclusao(usuario, "errada123");

    expect(await within(secao()).findByText("Senha incorreta")).toBeInTheDocument();
    expect(within(secao()).getByLabelText("Senha atual")).toHaveAttribute("aria-invalid", "true");
  });

  it("conta excluída: sai da conta e mostra o aviso no login", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("DELETE", "/auth/me", 200, { mensagem: "Conta excluída. Seus dados pessoais foram apagados." });

    await pedirExclusao(usuario, "leao1905");

    expect(await screen.findByRole("heading", { level: 1, name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Conta excluída. Seus dados pessoais foram apagados.");
    expect(localStorage.getItem("portal_token")).toBeNull();
  });

  it("cancelar fecha sem enviar nada", async () => {
    const usuario = await abrirMinhaArea();

    await usuario.click(within(secao()).getByRole("button", { name: "Excluir minha conta" }));
    await usuario.click(within(secao()).getByRole("button", { name: "Cancelar" }));

    expect(within(secao()).queryByLabelText("Senha atual")).not.toBeInTheDocument();
    expect(apiFalsa.chamadasA("DELETE", "/auth/me")).toEqual([]);
  });
});
