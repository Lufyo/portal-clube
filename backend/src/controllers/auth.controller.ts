import type { Request, Response } from "express";
import {
  loginSchema,
  perfilSchema,
  registerSchema,
  trocaDeSenhaSchema,
} from "../schemas/auth.schema";
import {
  atualizarPerfil,
  autenticarSocio,
  buscarPerfil,
  registrarSocio,
  trocarSenha,
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

// Perfil no formato da API (camelCase). O e-mail vem do Auth, não do perfil.
async function perfilDaApi(usuarioId: string, email: string) {
  const perfil = await buscarPerfil(usuarioId);
  return {
    id: perfil.id,
    nome: perfil.nome,
    cpf: perfil.cpf,
    dataNascimento: perfil.data_nascimento,
    numeroSocio: perfil.numero_socio,
    papel: perfil.papel,
    email,
    // null quando o sócio ainda não contratou um plano
    plano: perfil.plano
      ? {
          id: perfil.plano.id,
          nome: perfil.plano.nome,
          preco: perfil.plano.preco_mensal,
        }
      : null,
  };
}

// Rota protegida: o middleware já validou o token e guardou o id em res.locals
export async function meusDados(_req: Request, res: Response) {
  try {
    res.json(await perfilDaApi(res.locals.usuarioId, res.locals.email));
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function atualizarDados(req: Request, res: Response) {
  const resultado = perfilSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    await atualizarPerfil(res.locals.usuarioId, res.locals.email, resultado.data);
    const perfil = await perfilDaApi(res.locals.usuarioId, resultado.data.email);
    res.json({ mensagem: "Dados atualizados com sucesso", perfil });
  } catch (erro) {
    responderErro(res, erro);
  }
}

export async function alterarSenha(req: Request, res: Response) {
  const resultado = trocaDeSenhaSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      erro: "Dados inválidos",
      campos: formatarErrosZod(resultado.error),
    });
    return;
  }

  try {
    const { token } = await trocarSenha(res.locals.usuarioId, res.locals.email, resultado.data);
    // O token antigo deixou de valer: o novo vai junto para o site trocar
    res.json({ mensagem: "Senha alterada com sucesso", token });
  } catch (erro) {
    responderErro(res, erro);
  }
}
