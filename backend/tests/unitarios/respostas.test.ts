import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ErroDeNegocio } from "../../src/errors/ErroDeNegocio";
import { formatarErrosZod, responderErro } from "../../src/utils/respostas";
import { criarRes } from "../apoio/express";

describe("formatarErrosZod", () => {
  it("devolve { campo: mensagem }, só com a primeira mensagem de cada campo", () => {
    const schema = z.object({
      senha: z.string().min(8, "Curta demais").regex(/\d/, "Sem números"),
      email: z.string().email("E-mail inválido"),
    });
    const resultado = schema.safeParse({ senha: "abc", email: "x" });

    expect(resultado.success).toBe(false);
    expect(formatarErrosZod(resultado.error!)).toEqual({
      senha: "Curta demais",
      email: "E-mail inválido",
    });
  });
});

describe("responderErro", () => {
  it("usa o status e a mensagem do ErroDeNegocio", () => {
    const res = criarRes();
    responderErro(res, new ErroDeNegocio("Plano não encontrado", 404));

    expect(res.statusCode).toBe(404);
    expect(res.corpo).toEqual({ erro: "Plano não encontrado", campos: undefined });
  });

  it("repete a mensagem em 'campos' quando o erro é de um campo do formulário", () => {
    const res = criarRes();
    responderErro(res, new ErroDeNegocio("CPF já cadastrado", 409, "cpf"));

    expect(res.statusCode).toBe(409);
    expect(res.corpo).toEqual({ erro: "CPF já cadastrado", campos: { cpf: "CPF já cadastrado" } });
  });

  it("responde 500 genérico para erro inesperado, sem expor o detalhe", () => {
    const res = criarRes();
    responderErro(res, new Error("connection refused: senha do banco xyz"));

    expect(res.statusCode).toBe(500);
    expect(res.corpo).toEqual({ erro: "Erro interno do servidor" });
  });
});
