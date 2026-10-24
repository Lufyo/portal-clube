import { adminRoutes } from "./routes/admin.routes";
import { conteudoRoutes } from "./routes/conteudo.routes";
import { mensalidadeRoutes } from "./routes/mensalidade.routes";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { supabase } from "./config/supabase";
import { documentoOpenApi } from "./docs/openapi";
import { authRoutes } from "./routes/auth.routes";
import { planoRoutes } from "./routes/plano.routes";
import { ingressoRoutes } from "./routes/ingresso.routes";

export const app = express();

// Libera apenas o frontend local (Vite) para chamar a API
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());
// Sem corpo, o Express deixa req.body undefined: vira {} para a validação
// dizer o que falta em cada campo
app.use((req, _res, next) => {
  req.body ??= {};
  next();
});
app.use("/api/auth", authRoutes); // todas as rotas de auth começam com /api/auth
app.use("/api", planoRoutes);
app.use("/api", mensalidadeRoutes); // /api/mensalidades
app.use("/api", conteudoRoutes); // /api/jogos e /api/noticias
app.use("/api", adminRoutes);
app.use("/api", ingressoRoutes); // /api/ingressos

// Documentação da API: tela do Swagger em /api/docs e o arquivo OpenAPI em /api/openapi.json
app.get("/api/openapi.json", (_req, res) => {
  res.json(documentoOpenApi);
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(documentoOpenApi, {
    customSiteTitle: "API — Portal Sport Club do Recife",
    swaggerOptions: { persistAuthorization: true }, // o token não some ao recarregar
  })
);


// Rota de teste: confirma que a API e o banco estão funcionando
app.get("/api/health", async (_req, res) => {
  const { error } = await supabase
    .from("perfis")
    .select("id", { count: "exact", head: true });

  if (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
    return;
  }
  res.json({ status: "ok", banco: "conectado" });
});