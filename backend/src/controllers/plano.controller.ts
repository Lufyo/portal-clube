import type { Request, Response } from "express";
import { contratarSchema } from "../schemas/assinatura.schema";
import {
  cancelarPlano,
  contratarPlano,
  listarPlanos,
} from "../services/plano.service";
import { formatarErrosZod, responderErro } from "../utils/respostas";

export async function listar(_req: Request, res: Response) {
  try {
    res.json(await listarPlanos());
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function contratar(req: Request, res: Response) {
  const resultado = contratarSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    // usuarioId vem do middleware exigirLogin, nunca do corpo da requisição
    const plano = await contratarPlano(res.locals.usuarioId, resultado.data.planoId);
    res.json({ mensagem: "Plano contratado com sucesso", plano });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function cancelar(_req: Request, res: Response) {
  try {
    await cancelarPlano(res.locals.usuarioId);
    res.json({ mensagem: "Plano cancelado com sucesso" });
  } catch (erro) {
    responderErro(res, erro);
  }
}