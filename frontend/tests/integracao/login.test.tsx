import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiFalsa } from "../apoio/apiFalsa";
import { abrirApp } from "../apoio/renderizar";

async function preencherEEntrar(email: string, senha: string) {
  const usuario = userEvent.setup();
  await usuario.type(await screen.findByLabelText("E-mail"), email);
  await usuario.type(screen.getByLabelText("Senha"), senha);
  await usuario.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("login", () => {
  it("depois de entrar, volta para a página que a pessoa tentou abrir", async () => {
    apiFalsa.responder("POST", "/auth/login", 200, {
      token: "jwt-novo",
      usuario: { id: "u1", nome: "Maria", email: "maria@exemplo.com", papel: "socio" },
    });
    apiFalsa.responder("GET", "/mensalidades", 200, []);

    abrirApp("/mensalidades");
    await preencherEEntrar("maria@exemplo.com", "leao1905");

    expect(await screen.findByRole("heading", { level: 1, name: "Mensalidades" })).toBeInTheDocument();
    expect(localStorage.getItem("portal_token")).toBe("jwt-novo");
    expect(apiFalsa.chamadasA("POST", "/auth/login")[0].corpo).toEqual({
      email: "maria@exemplo.com",
      senha: "leao1905",
    });
    // A chamada seguinte já leva o token novo
    expect(apiFalsa.chamadasA("GET", "/mensalidades")[0].cabecalhos).toEqual({ Authorization: "Bearer jwt-novo" });
  });

  it("senha errada mostra a mensagem da API e continua no login", async () => {
    apiFalsa.responder("POST", "/auth/login", 401, { erro: "E-mail ou senha incorretos" });

    abrirApp("/login");
    await preencherEEntrar("maria@exemplo.com", "errada123");

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos");
    expect(localStorage.getItem("portal_token")).toBeNull();
  });

  it("erro de um campo aparece embaixo do campo, ligado a ele para leitores de tela", async () => {
    apiFalsa.responder("POST", "/auth/login", 400, {
      erro: "Dados inválidos",
      campos: { senha: "Informe a senha" },
    });

    abrirApp("/login");
    await preencherEEntrar("maria@exemplo.com", "x");

    const senha = screen.getByLabelText("Senha");
    expect(await screen.findByText("Informe a senha")).toBeInTheDocument();
    expect(senha).toHaveAttribute("aria-invalid", "true");
    expect(senha).toHaveAccessibleDescription("Informe a senha");
  });

  it("servidor fora do ar mostra mensagem clara", async () => {
    apiFalsa.falharRede("POST", "/auth/login");

    abrirApp("/login");
    await preencherEEntrar("maria@exemplo.com", "leao1905");

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor");
  });
});
