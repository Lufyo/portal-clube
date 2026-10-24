import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { apiFalsa } from "../apoio/apiFalsa";
import { abrirApp, jaLogadoComo } from "../apoio/renderizar";

const resumo = { cadastros: 10, sociosComPlano: 5, mensalidadesPendentes: 1, noticiasPublicadas: 2, jogos: 3 };

describe("acesso às páginas", () => {
  it("sem login, a área do sócio leva para o login", async () => {
    abrirApp("/minha-area");

    expect(await screen.findByRole("heading", { level: 1, name: "Entrar" })).toBeInTheDocument();
    expect(apiFalsa.chamadas).toEqual([]);
  });

  it("token salvo vencido é descartado e a pessoa vai para o login", async () => {
    localStorage.setItem("portal_token", "vencido");
    apiFalsa.responder("GET", "/auth/me", 401, { erro: "Token inválido ou expirado" });

    abrirApp("/minha-area");

    expect(await screen.findByRole("heading", { level: 1, name: "Entrar" })).toBeInTheDocument();
    expect(localStorage.getItem("portal_token")).toBeNull();
  });

  it("sócio que tenta abrir o painel volta para a área do sócio", async () => {
    jaLogadoComo("socio");
    apiFalsa.responder("GET", "/auth/me", 200, {
      id: "u1",
      nome: "Maria",
      cpf: "52998224725",
      dataNascimento: "1995-04-13",
      numeroSocio: 42,
      papel: "socio",
      email: "maria@exemplo.com",
      plano: null,
    });
    apiFalsa.responder("GET", "/planos", 200, []);

    abrirApp("/admin");

    expect(await screen.findByRole("heading", { level: 1, name: "Minha área" })).toBeInTheDocument();
    expect(apiFalsa.chamadasA("GET", "/admin/resumo")).toEqual([]);
  });

  it.each(["editor", "gestor", "admin"] as const)("%s abre o painel", async (papel) => {
    jaLogadoComo(papel, "Ana");
    apiFalsa.responder("GET", "/admin/resumo", 200, resumo);

    abrirApp("/admin");

    expect(await screen.findByRole("heading", { level: 1, name: "Painel" })).toBeInTheDocument();
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument();
  });

  it("endereço que não existe mostra a página 404", async () => {
    abrirApp("/pagina-que-nao-existe");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/não encontrada/i);
  });
});
