import type { Request, Response } from "express";
import { noticiaSchema, publicacaoSchema } from "../schemas/noticia.schema";
import {
  alterarPublicacao,
  atualizarNoticia,
  buscarNoticiaAdmin,
  criarNoticia,
  excluirNoticia,
  listarNoticiasAdmin,
} from "../services/noticia-admin.service";
import { formatarErrosZod, responderErro } from "../utils/respostas";

// O id vem da URL: /admin/noticias/:id
const idDaUrl = (req: Request) => String(req.params.id);

export async function listar(_req: Request, res: Response) {
  try {
    res.json(await listarNoticiasAdmin());
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    res.json(await buscarNoticiaAdmin(idDaUrl(req)));
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function criar(req: Request, res: Response) {
  const resultado = noticiaSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const noticia = await criarNoticia(resultado.data);
    res.status(201).json({ mensagem: "Notícia criada com sucesso", noticia });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function editar(req: Request, res: Response) {
  const resultado = noticiaSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const noticia = await atualizarNoticia(idDaUrl(req), resultado.data);
    res.json({ mensagem: "Notícia salva com sucesso", noticia });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function publicar(req: Request, res: Response) {
  const resultado = publicacaoSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const noticia = await alterarPublicacao(
      idDaUrl(req),
      resultado.data.publicada
    );
    res.json({
      mensagem: noticia.publicada ? "Notícia publicada" : "Notícia despublicada",
      noticia,
    });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function excluir(req: Request, res: Response) {
  try {
    await excluirNoticia(idDaUrl(req));
    res.json({ mensagem: "Notícia excluída" });
  } catch (erro) {
    responderErro(res, erro);
  }
}