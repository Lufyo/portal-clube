import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";

// Request, Response e next de mentira, para testar middlewares e funções
// de resposta sem subir o servidor.

export function criarRes() {
  const res = {
    statusCode: 200,
    corpo: undefined as unknown,
    locals: {} as Record<string, unknown>,
    status: vi.fn((codigo: number) => {
      res.statusCode = codigo;
      return res;
    }),
    json: vi.fn((corpo: unknown) => {
      res.corpo = corpo;
      return res;
    }),
  };
  return res as typeof res & Response;
}

export function criarReq(cabecalhos: Record<string, string> = {}) {
  return { headers: cabecalhos } as unknown as Request;
}

export const criarNext = () => vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
