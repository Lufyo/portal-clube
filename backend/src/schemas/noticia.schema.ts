import { z } from "zod";

// Mesmas listas do banco (check constraints) e do frontend
export const categorias = [
  "Profissional masculino",
  "Profissional feminino",
  "Categorias de base",
  "Esportes olímpicos",
] as const;

export const tipos = ["Notícia", "Coletiva", "Comunicado", "Entrevista"] as const;

export const noticiaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "O título deve ter pelo menos 5 caracteres")
    .max(140, "O título pode ter no máximo 140 caracteres"),
  resumo: z
    .string()
    .trim()
    .min(10, "O resumo deve ter pelo menos 10 caracteres")
    .max(300, "O resumo pode ter no máximo 300 caracteres"),
  conteudo: z
    .string()
    .trim()
    .min(20, "O texto deve ter pelo menos 20 caracteres")
    .max(20000, "O texto é longo demais"),
  categoria: z.enum(categorias, { message: "Escolha uma categoria" }),
  tipo: z.enum(tipos, { message: "Escolha um tipo" }),
  // Notícia nova nasce como rascunho, a menos que se peça o contrário
  publicada: z.boolean().default(false),
});

export const publicacaoSchema = z.object({
  publicada: z.boolean({ message: "Informe se a notícia deve ser publicada" }),
});

export type NoticiaInput = z.infer<typeof noticiaSchema>;