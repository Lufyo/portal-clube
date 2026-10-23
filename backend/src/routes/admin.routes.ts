import { Router } from "express";
import { resumo } from "../controllers/admin.controller";
import {
  buscar,
  criar,
  editar,
  excluir,
  listar,
  publicar,
} from "../controllers/noticia-admin.controller";
import { exigirLogin } from "../middlewares/exigirLogin";
import { exigirPapel } from "../middlewares/exigirPapel";

export const adminRoutes = Router();

// Resumo: editor e gestor (o admin sempre entra)
adminRoutes.get(
  "/admin/resumo",
  exigirLogin,
  exigirPapel("editor", "gestor"),
  resumo
);

// Gestão de notícias: só o editor (e o admin)
const soEditor = [exigirLogin, exigirPapel("editor")];

adminRoutes.get("/admin/noticias", ...soEditor, listar);
adminRoutes.get("/admin/noticias/:id", ...soEditor, buscar);
adminRoutes.post("/admin/noticias", ...soEditor, criar);
adminRoutes.put("/admin/noticias/:id", ...soEditor, editar);
adminRoutes.patch("/admin/noticias/:id/publicacao", ...soEditor, publicar);
adminRoutes.delete("/admin/noticias/:id", ...soEditor, excluir);