import { afterEach, beforeEach, expect, vi } from "vitest";
import { banco } from "./supabaseFalso";

// O módulo de configuração de verdade exige o .env e conecta no Supabase.
// Nos testes, todo o código passa a usar o banco falso.
vi.mock("../../src/config/supabase", async () => {
  const { banco: falso } = await vi.importActual<{ banco: typeof banco }>("./supabaseFalso");
  return { supabase: falso.cliente, criarCliente: () => falso.cliente };
});

beforeEach(() => {
  banco.limpar();
  // Os services registram falhas no console; nos testes isso só polui a saída
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  // Resposta configurada e não usada = o código não fez a consulta esperada
  expect(banco.respostasSobrando(), "respostas do banco falso que ninguém consultou").toEqual([]);
});
