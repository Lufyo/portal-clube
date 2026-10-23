import { z } from "zod";

export const compraSchema = z.object({
  jogoId: z.string().min(1, "Escolha um jogo"),
  setorId: z.string().min(1, "Escolha um setor"),
  quantidade: z
    .number({ message: "Informe a quantidade" })
    .int("Informe um número inteiro")
    .min(1, "Escolha pelo menos 1 ingresso")
    .max(4, "O limite é de 4 ingressos por compra"),
});

export type CompraInput = z.infer<typeof compraSchema>;