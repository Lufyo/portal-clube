import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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

// Minha área aberta por um sócio logado: /auth/me (login salvo e página),
// e /planos (bloco "Meu plano")
async function abrirMinhaArea() {
  jaLogadoComo("socio");
  apiFalsa.responder("GET", "/auth/me", 200, perfil);
  apiFalsa.responder("GET", "/planos", 200, []);
  abrirApp("/minha-area");
  await screen.findByRole("heading", { name: "Meus dados" });
  return userEvent.setup();
}

const secao = (nome: string) => screen.getByRole("region", { name: nome });

describe("editar meus dados", () => {
  it("altera o nome sem pedir senha e mostra os dados novos", async () => {
    const usuario = await abrirMinhaArea();
    const novo = { ...perfil, nome: "Maria Leão da Silva" };
    apiFalsa.responder("PATCH", "/auth/me", 200, { mensagem: "Dados atualizados com sucesso", perfil: novo });
    apiFalsa.responder("GET", "/auth/me", 200, novo);

    await usuario.click(screen.getByRole("button", { name: "Editar dados" }));
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
    const nome = screen.getByLabelText("Nome completo");
    await usuario.clear(nome);
    await usuario.type(nome, "Maria Leão da Silva");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Dados atualizados com sucesso");
    expect(within(secao("Meus dados")).getByText("Maria Leão da Silva")).toBeInTheDocument();
    expect(apiFalsa.chamadasA("PATCH", "/auth/me")[0].corpo).toEqual({
      nome: "Maria Leão da Silva",
      email: "maria@exemplo.com",
      dataNascimento: "1995-04-13",
    });
  });

  it("o CPF aparece, mas não pode ser editado", async () => {
    const usuario = await abrirMinhaArea();
    await usuario.click(screen.getByRole("button", { name: "Editar dados" }));

    expect(screen.queryByLabelText("CPF")).not.toBeInTheDocument();
    expect(within(secao("Meus dados")).getByText("529.982.247-25")).toBeInTheDocument();
  });

  it("ao trocar o e-mail, pede a senha atual e mostra o erro da API no campo", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("PATCH", "/auth/me", 400, {
      erro: "Senha incorreta",
      campos: { senhaAtual: "Senha incorreta" },
    });

    await usuario.click(screen.getByRole("button", { name: "Editar dados" }));
    const email = screen.getByLabelText("E-mail");
    await usuario.clear(email);
    await usuario.type(email, "nova@exemplo.com");
    await usuario.type(screen.getByLabelText("Senha atual"), "errada123");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    const senha = screen.getByLabelText("Senha atual");
    expect(await screen.findByText("Senha incorreta")).toBeInTheDocument();
    expect(senha).toHaveAttribute("aria-invalid", "true");
    expect(apiFalsa.chamadasA("PATCH", "/auth/me")[0].corpo).toMatchObject({
      email: "nova@exemplo.com",
      senhaAtual: "errada123",
    });
  });

  it("cancelar fecha o formulário sem enviar nada", async () => {
    const usuario = await abrirMinhaArea();

    await usuario.click(screen.getByRole("button", { name: "Editar dados" }));
    await usuario.type(screen.getByLabelText("Nome completo"), " Teste");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(within(secao("Meus dados")).getByText("Maria Silva")).toBeInTheDocument();
    expect(apiFalsa.chamadasA("PATCH", "/auth/me")).toEqual([]);
  });
});

describe("trocar senha", () => {
  async function preencher(usuario: ReturnType<typeof userEvent.setup>, atual: string, nova: string, confirmacao: string) {
    await usuario.click(screen.getByRole("button", { name: "Trocar senha" }));
    await usuario.type(screen.getByLabelText("Senha atual"), atual);
    await usuario.type(screen.getByLabelText("Nova senha"), nova);
    await usuario.type(screen.getByLabelText("Confirme a nova senha"), confirmacao);
    await usuario.click(screen.getByRole("button", { name: "Salvar nova senha" }));
  }

  it("troca a senha e confirma na tela", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("PUT", "/auth/senha", 200, { mensagem: "Senha alterada com sucesso", token: "token-novo" });

    await preencher(usuario, "leao1905", "sport1905", "sport1905");

    expect(await screen.findByRole("status")).toHaveTextContent("Senha alterada com sucesso");
    // Trocar a senha invalida o token antigo: o site passa a usar o novo
    expect(localStorage.getItem("portal_token")).toBe("token-novo");
    expect(apiFalsa.chamadasA("PUT", "/auth/senha")[0].corpo).toEqual({
      senhaAtual: "leao1905",
      novaSenha: "sport1905",
    });
    // O formulário fecha e não guarda as senhas digitadas
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
  });

  it("sem token novo na resposta, leva para o login pedindo para entrar de novo", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("PUT", "/auth/senha", 200, { mensagem: "Senha alterada com sucesso", token: null });

    await preencher(usuario, "leao1905", "sport1905", "sport1905");

    expect(await screen.findByRole("heading", { level: 1, name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Senha alterada. Entre de novo com a nova senha.");
    expect(localStorage.getItem("portal_token")).toBeNull();
  });

  it("confirmação diferente não chega a ser enviada", async () => {
    const usuario = await abrirMinhaArea();

    await preencher(usuario, "leao1905", "sport1905", "sport1906");

    expect(await screen.findByText("As senhas não conferem")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirme a nova senha")).toHaveAttribute("aria-invalid", "true");
    expect(apiFalsa.chamadasA("PUT", "/auth/senha")).toEqual([]);
  });

  it("senha atual errada aparece no campo certo", async () => {
    const usuario = await abrirMinhaArea();
    apiFalsa.responder("PUT", "/auth/senha", 400, {
      erro: "Senha atual incorreta",
      campos: { senhaAtual: "Senha atual incorreta" },
    });

    await preencher(usuario, "errada123", "sport1905", "sport1905");

    expect(await screen.findByText("Senha atual incorreta")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveAccessibleDescription("Senha atual incorreta");
  });
});
