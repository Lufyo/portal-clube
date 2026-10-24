import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { apiFalsa } from "../apoio/apiFalsa";
import { abrirApp, jaLogadoComo } from "../apoio/renderizar";

const pendente = {
  id: "m1",
  referencia: "2999-10-01",
  plano: "Leão Prata",
  valor: 59.9,
  vencimento: "2999-10-10",
  status: "pendente",
  pagoEm: null,
};

describe("mensalidades", () => {
  it("paga uma mensalidade e a lista é atualizada", async () => {
    jaLogadoComo("socio");
    apiFalsa.responder("GET", "/mensalidades", 200, [pendente]);
    apiFalsa.responder("POST", "/mensalidades/m1/pagar", 200, { mensagem: "Mensalidade paga com sucesso" });
    apiFalsa.responder("GET", "/mensalidades", 200, [
      { ...pendente, status: "paga", pagoEm: "2999-10-05T12:00:00Z" },
    ]);

    abrirApp("/mensalidades");
    const item = (await screen.findByRole("heading", { name: "Outubro de 2999" })).closest("li")!;
    expect(within(item).getByText("Pendente")).toBeInTheDocument();

    await userEvent.setup().click(within(item).getByRole("button", { name: "Pagar R$ 59,90" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Pagamento registrado com sucesso!");
    expect(within(item).getByText("Paga")).toBeInTheDocument();
    expect(within(item).queryByRole("button")).not.toBeInTheDocument();
  });

  it("mostra 'Em atraso' quando o vencimento já passou", async () => {
    jaLogadoComo("socio");
    apiFalsa.responder("GET", "/mensalidades", 200, [
      { ...pendente, referencia: "2020-01-01", vencimento: "2020-01-10" },
    ]);

    abrirApp("/mensalidades");

    expect(await screen.findByText("Em atraso")).toBeInTheDocument();
  });

  it("erro ao pagar aparece na tela e o botão continua disponível", async () => {
    jaLogadoComo("socio");
    apiFalsa.responder("GET", "/mensalidades", 200, [pendente]);
    apiFalsa.responder("POST", "/mensalidades/m1/pagar", 409, { erro: "Esta mensalidade já foi paga" });

    abrirApp("/mensalidades");
    await userEvent.setup().click(await screen.findByRole("button", { name: /Pagar/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta mensalidade já foi paga");
    expect(screen.getByRole("button", { name: /Pagar/ })).toBeEnabled();
  });

  it("sem plano, explica e leva para a escolha do plano", async () => {
    jaLogadoComo("socio");
    apiFalsa.responder("GET", "/mensalidades", 200, []);

    abrirApp("/mensalidades");

    expect(await screen.findByText(/ainda não tem mensalidades/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escolha um plano" })).toHaveAttribute("href", "/minha-area");
  });
});
