import type { Request, Response } from "express";
import {
  listarMensalidades,
  pagarMensalidade,
} from "../services/mensalidade.service";
import { responderErro } from "../utils/respostas";

export async function listar(_req: Request, res: Response) {
  try {
    res.json(await listarMensalidades(res.locals.usuarioId));
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function pagar(req: Request, res: Response) {
  try {
    // usuarioId vem do token (middleware), o id da mensalidade vem da URL
    await pagarMensalidade(res.locals.usuarioId, String(req.params.id));
    res.json({ mensagem: "Mensalidade paga com sucesso" });
  } catch (erro) {
    responderErro(res, erro);
  }
}