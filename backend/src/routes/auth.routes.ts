import { Router } from "express";
import {
  alterarSenha,
  atualizarDados,
  excluirMinhaConta,
  exportarMeusDados,
  login,
  meusDados,
  registrar,
} from "../controllers/auth.controller";
import { exigirLogin } from "../middlewares/exigirLogin";

export const authRoutes = Router();

authRoutes.post("/register", registrar);
authRoutes.post("/login", login);
// exigirLogin roda antes do controller: sem token válido, a rota nem é executada
authRoutes.get("/me", exigirLogin, meusDados);
authRoutes.patch("/me", exigirLogin, atualizarDados);
authRoutes.put("/senha", exigirLogin, alterarSenha);
// LGPD: exportar os próprios dados e excluir a conta
authRoutes.get("/me/dados", exigirLogin, exportarMeusDados);
authRoutes.delete("/me", exigirLogin, excluirMinhaConta);
