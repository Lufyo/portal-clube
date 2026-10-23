import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";

export async function exigirLogin(req: Request, res: Response, next: NextFunction) {
  // O cabeçalho chega assim: "Bearer eyJhbGciOi..."
  const cabecalho = req.headers.authorization;
  const token = cabecalho?.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    res.status(401).json({ erro: "Token não informado" });
    return;
  }

  // O Supabase confere se o token é válido e não expirou
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ erro: "Token inválido ou expirado" });
    return;
  }

  // res.locals leva dados do middleware até o controller
  res.locals.usuarioId = data.user.id;
  res.locals.email = data.user.email;
  next();
}