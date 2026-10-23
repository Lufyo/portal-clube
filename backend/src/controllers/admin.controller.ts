import type { Request, Response } from "express";
import { obterResumo } from "../services/admin.service";
import { responderErro } from "../utils/respostas";

export async function resumo(_req: Request, res: Response) {
  try {
    res.json(await obterResumo());
  } catch (erro) {
    responderErro(res, erro);
  }
}