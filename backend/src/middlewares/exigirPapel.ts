import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";

export type Papel = "socio" | "editor" | "gestor" | "admin";

// Uso: exigirPapel("editor") libera editores e também administradores.
// O admin é sempre liberado (permissões cumulativas do escopo).
export function exigirPapel(...permitidos: Papel[]) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const { data, error } = await supabase
      .from("perfis")
      .select("papel")
      .eq("id", res.locals.usuarioId) // definido pelo exigirLogin
      .single();

    if (error || !data) {
      res.status(403).json({ erro: "Acesso negado" });
      return;
    }

    const papel = data.papel as Papel;

    if (papel !== "admin" && !permitidos.includes(papel)) {
      res.status(403).json({ erro: "Acesso negado" });
      return;
    }

    res.locals.papel = papel;
    next();
  };
}