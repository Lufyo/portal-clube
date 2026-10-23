import { Router } from "express";
import { cancelar, contratar, listar } from "../controllers/plano.controller";
import { exigirLogin } from "../middlewares/exigirLogin";

export const planoRoutes = Router();

planoRoutes.get("/planos", listar); // pública: a landing usa
planoRoutes.post("/assinatura", exigirLogin, contratar);
planoRoutes.delete("/assinatura", exigirLogin, cancelar);