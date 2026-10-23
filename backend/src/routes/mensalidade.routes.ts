import { Router } from "express";
import { listar, pagar } from "../controllers/mensalidade.controller";
import { exigirLogin } from "../middlewares/exigirLogin";

export const mensalidadeRoutes = Router();

mensalidadeRoutes.get("/mensalidades", exigirLogin, listar);
mensalidadeRoutes.post("/mensalidades/:id/pagar", exigirLogin, pagar);