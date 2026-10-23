import { z } from "zod";

// Confere os dígitos verificadores do CPF
function cpfValido(cpf: string): boolean {
  // Rejeita tamanho errado e sequências como 111.111.111-11
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calcularDigito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcularDigito(cpf.slice(0, 9), 10);
  const digito2 = calcularDigito(cpf.slice(0, 10), 11);
  return digito1 === Number(cpf[9]) && digito2 === Number(cpf[10]);
}

export const registerSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  // Aceita "529.982.247-25" ou "52998224725": guardamos só os números
  cpf: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine(cpfValido, "CPF inválido"),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD")
    .refine((data) => new Date(data) < new Date(), "Data de nascimento inválida"),
  // Regra do RNF04: mínimo 8 caracteres, com letras e números
  senha: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter letras")
    .regex(/\d/, "A senha deve conter números"),
});

// Tipo TypeScript gerado automaticamente a partir do schema
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;