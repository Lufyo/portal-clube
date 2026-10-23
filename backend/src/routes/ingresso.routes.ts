import { Router } from "express";
import {
  comprar,
  dadosDoJogo,
  meusIngressos,
} from "../controllers/ingresso.controller";
import { exigirLogin } from "../middlewares/exigirLogin";

export const ingressoRoutes = Router();

ingressoRoutes.get("/ingressos/jogos/:jogoId", exigirLogin, dadosDoJogo);
ingressoRoutes.post("/ingressos", exigirLogin, comprar);
ingressoRoutes.get("/ingressos", exigirLogin, meusIngressos);