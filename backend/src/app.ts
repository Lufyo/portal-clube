import { adminRoutes } from "./routes/admin.routes";
import { conteudoRoutes } from "./routes/conteudo.routes";
import { mensalidadeRoutes } from "./routes/mensalidade.routes";
import cors from "cors";
import express from "express";
import { supabase } from "./config/supabase";
import { authRoutes } from "./routes/auth.routes";
import { planoRoutes } from "./routes/plano.routes";

export const app = express();

// Libera apenas o frontend local (Vite) para chamar a API
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes); // todas as rotas de auth começam com /api/auth
app.use("/api", planoRoutes);
app.use("/api", mensalidadeRoutes); // /api/mensalidades
app.use("/api", conteudoRoutes); // /api/jogos e /api/noticias
app.use("/api", adminRoutes); // /api/admin/...


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