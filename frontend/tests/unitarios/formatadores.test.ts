import { describe, expect, it, vi } from "vitest";
import { formatarData, formatarMes, formatarMoeda, hojeNoBrasil } from "../../src/utils/formatadores";

describe("formatadores", () => {
  it("formatarData troca AAAA-MM-DD por DD/MM/AAAA, sem mexer no dia por causa do fuso", () => {
    expect(formatarData("2026-10-01")).toBe("01/10/2026");
  });

  it("formatarMoeda usa reais no padrão brasileiro", () => {
    // toLocaleString separa "R$" do valor com um espaço não separável
    expect(formatarMoeda(59.9)).toBe("R$ 59,90");
    expect(formatarMoeda(1234.5)).toBe("R$ 1.234,50");
  });

  it("formatarMes escreve o mês por extenso, com inicial maiúscula", () => {
    expect(formatarMes("2026-10-01")).toBe("Outubro de 2026");
  });

  it("hojeNoBrasil usa o fuso de São Paulo, não o do computador", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 1º de novembro às 01h em UTC ainda é 31 de outubro em São Paulo
    vi.setSystemTime(new Date("2026-11-01T01:00:00Z"));

    expect(hojeNoBrasil()).toBe("2026-10-31");
  });
});
