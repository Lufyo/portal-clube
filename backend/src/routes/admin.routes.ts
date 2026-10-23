import { Router } from "express";
import { resumo } from "../controllers/admin.controller";
import { exigirLogin } from "../middlewares/exigirLogin";
import { exigirPapel } from "../middlewares/exigirPapel";

export const adminRoutes = Router();

// Primeiro confere o login, depois o perfil. Editor, gestor e admin acessam.
adminRoutes.get(
  "/admin/resumo",
  exigirLogin,
  exigirPapel("editor", "gestor"),
  resumo
);