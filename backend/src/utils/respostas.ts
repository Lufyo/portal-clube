import type { Response } from "express";
import type { ZodError } from "zod";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";

// Transforma os erros do Zod em { campo: "mensagem" }
export function formatarErrosZod(erro: ZodError) {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) {
    const campo = String(problema.path[0]);
    if (!campos[campo]) campos[campo] = problema.message;
  }
  return campos;
}

// Resposta padrão para erros de negócio ou inesperados
export function responderErro(res: Response, erro: unknown) {
  if (erro instanceof ErroDeNegocio) {
    res.status(erro.status).json({
      erro: erro.message,
      campos: erro.campo ? { [erro.campo]: erro.message } : undefined,
    });
    return;
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
}