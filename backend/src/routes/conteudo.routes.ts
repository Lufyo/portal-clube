import { Router } from "express";
import {
  obterJogos,
  obterNoticia,
  obterNoticias,
} from "../controllers/conteudo.controller";

export const conteudoRoutes = Router();

// Rotas públicas: qualquer visitante pode ler
conteudoRoutes.get("/jogos", obterJogos);
conteudoRoutes.get("/noticias", obterNoticias);
conteudoRoutes.get("/noticias/:id", obterNoticia);