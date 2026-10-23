import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import {
  autenticarSocio,
  buscarPerfil,
  registrarSocio,
} from "../services/auth.service";
import { formatarErrosZod, responderErro } from "../utils/respostas";

export async function registrar(req: Request, res: Response) {
  const resultado = registerSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const usuario = await registrarSocio(resultado.data);
    res.status(201).json({ mensagem: "Cadastro realizado com sucesso", usuario });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function login(req: Request, res: Response) {
  const resultado = loginSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const sessao = await autenticarSocio(resultado.data);
    res.json(sessao);
  } catch (erro) {
    responderErro(res, erro);
  }
}

// Rota protegida: o middleware já validou o token e guardou o id em res.locals
export async function meusDados(_req: Request, res: Response) {
  try {
    const perfil = await buscarPerfil(res.locals.usuarioId);
    res.json({
      id: perfil.id,
      nome: perfil.nome,
      cpf: perfil.cpf,
      dataNascimento: perfil.data_nascimento,
      numeroSocio: perfil.numero_socio,
      papel: perfil.papel,
      email: res.locals.email,
      // null quando o sócio ainda não contratou um plano
      plano: perfil.plano
        ? {
            id: perfil.plano.id,
            nome: perfil.plano.nome,
            preco: perfil.plano.preco_mensal,
          }
        : null,
    });
  } catch (erro) {
    responderErro(res, erro);
  }
}