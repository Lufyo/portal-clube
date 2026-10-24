import { z } from "./zod";

export const contratarSchema = z.object({
  planoId: z.string({ message: "Escolha um plano" }).min(1, "Escolha um plano"),
});
