import { z } from "zod";

export const contratarSchema = z.object({
  planoId: z.string().min(1, "Escolha um plano"),
});