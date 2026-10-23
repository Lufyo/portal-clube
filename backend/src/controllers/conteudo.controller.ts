import type { Request, Response } from "express";
import { listarJogos } from "../services/jogo.service";
import { buscarNoticiaPublica, listarNoticias } from "../services/noticia.service";
import { responderErro } from "../utils/respostas";

export async function obterJogos(_req: Request, res: Response) {
  try {
    res.json(await listarJogos());
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function obterNoticias(_req: Request, res: Response) {
  try {
    res.json(await listarNoticias());
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function obterNoticia(req: Request, res: Response) {
  try {
    res.json(await buscarNoticiaPublica(String(req.params.id)));
  } catch (erro) {
    responderErro(res, erro);
  }
}