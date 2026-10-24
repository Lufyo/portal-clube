import { describe, expect, it } from "vitest";
import { podeAcessar, temPainel } from "../../src/utils/permissoes";

describe("permissoes (mesma regra do backend)", () => {
  it("o admin pode tudo, mesmo fora da lista", () => {
    expect(podeAcessar("admin", ["editor"])).toBe(true);
  });

  it("os demais só acessam o que está na lista", () => {
    expect(podeAcessar("editor", ["editor", "gestor"])).toBe(true);
    expect(podeAcessar("gestor", ["editor"])).toBe(false);
    expect(podeAcessar("socio", ["editor", "gestor"])).toBe(false);
  });

  it("só quem trabalha no clube vê o painel", () => {
    expect(temPainel("socio")).toBe(false);
    expect(["editor", "gestor", "admin"].every((papel) => temPainel(papel as "editor"))).toBe(true);
  });
});
