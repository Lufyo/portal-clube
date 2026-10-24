import { z } from "./zod";

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

// Campos compartilhados pelo cadastro e pela edição de dados
const nome = z.string({ message: "Informe seu nome completo" }).trim().min(3, "Informe seu nome completo");
const email = z.string({ message: "Informe seu e-mail" }).trim().toLowerCase().email("E-mail inválido");
const dataNascimento = z
  .string({ message: "Informe sua data de nascimento" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD")
  .refine((data) => new Date(data) < new Date(), "Data de nascimento inválida");

// Regra do RNF04: mínimo 8 caracteres, com letras e números
const senhaForte = (mensagemSeAusente: string) =>
  z
    .string({ message: mensagemSeAusente })
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter letras")
    .regex(/\d/, "A senha deve conter números");

export const registerSchema = z.object({
  nome,
  email,
  // Aceita "529.982.247-25" ou "52998224725" (letras e outros símbolos, não):
  // guardamos só os números
  cpf: z
    .string({ message: "Informe seu CPF" })
    .trim()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine(cpfValido, "CPF inválido"),
  dataNascimento,
  senha: senhaForte("Crie uma senha"),
});

// Tipo TypeScript gerado automaticamente a partir do schema
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string({ message: "Informe seu e-mail" }).trim().toLowerCase().email("E-mail inválido"),
  senha: z.string({ message: "Informe a senha" }).min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;
// Editar dados. O CPF fica de fora de propósito: é o documento que identifica
// o sócio e não pode ser trocado pela área do sócio. A senha atual só é
// exigida (no service) quando o e-mail muda.
export const perfilSchema = z.object({
  nome,
  email,
  dataNascimento,
  senhaAtual: z.string({ message: "Informe sua senha" }).optional(),
});

export type PerfilInput = z.infer<typeof perfilSchema>;

export const trocaDeSenhaSchema = z
  .object({
    senhaAtual: z.string({ message: "Informe sua senha atual" }).min(1, "Informe sua senha atual"),
    novaSenha: senhaForte("Crie uma nova senha"),
  })
  .refine((dados) => dados.novaSenha !== dados.senhaAtual, {
    message: "A nova senha deve ser diferente da atual",
    path: ["novaSenha"],
  });

export type TrocaDeSenhaInput = z.infer<typeof trocaDeSenhaSchema>;

// Excluir a conta pede a senha: quem pegar uma sessão aberta não apaga a conta
export const exclusaoDeContaSchema = z.object({
  senhaAtual: z.string({ message: "Informe sua senha atual" }).min(1, "Informe sua senha atual"),
});

export type ExclusaoDeContaInput = z.infer<typeof exclusaoDeContaSchema>;
