import type { Request, Response } from "express";
import { compraSchema } from "../schemas/ingresso.schema";
import {
  comprarIngressos,
  dadosDeCompra,
  listarIngressos,
} from "../services/ingresso.service";
import { formatarErrosZod, responderErro } from "../utils/respostas";

export async function dadosDoJogo(req: Request, res: Response) {
  try {
    res.json(
      await dadosDeCompra(res.locals.usuarioId, String(req.params.jogoId))
    );
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function comprar(req: Request, res: Response) {
  const resultado = compraSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const compra = await comprarIngressos(res.locals.usuarioId, resultado.data);
    res.status(201).json({ mensagem: "Compra realizada com sucesso", ...compra });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function meusIngressos(_req: Request, res: Response) {
  try {
    res.json(await listarIngressos(res.locals.usuarioId));
  } catch (erro) {
    responderErro(res, erro);
  }
}