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
      .maybeSingle(); // perfil inexistente chega como null, não como erro

    // Falha do banco: responde 500 em vez de "acesso negado", que faria quem
    // tem permissão achar que não tem. Nos dois casos a rota não é executada.
    if (error) {
      console.error(error);
      res.status(500).json({ erro: "Não foi possível verificar suas permissões" });
      return;
    }
    if (!data) {
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