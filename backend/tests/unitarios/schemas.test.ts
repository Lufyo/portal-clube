import { describe, expect, it } from "vitest";
import { contratarSchema } from "../../src/schemas/assinatura.schema";
import { loginSchema, registerSchema } from "../../src/schemas/auth.schema";
import { compraSchema } from "../../src/schemas/ingresso.schema";
import { noticiaSchema, publicacaoSchema } from "../../src/schemas/noticia.schema";
import { formatarErrosZod } from "../../src/utils/respostas";

// Mensagens por campo, no mesmo formato que a API devolve
function errosDe(schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } }, valor: unknown) {
  const resultado = schema.safeParse(valor);
  if (resultado.success) return {};
  return formatarErrosZod(resultado.error as Parameters<typeof formatarErrosZod>[0]);
}

const cadastroValido = {
  nome: "Maria Leão da Silva",
  email: "maria@exemplo.com",
  cpf: "529.982.247-25",
  dataNascimento: "1995-04-13",
  senha: "leao1905",
};

describe("registerSchema (cadastro)", () => {
  it("aceita um cadastro válido e guarda o CPF só com números", () => {
    const resultado = registerSchema.parse(cadastroValido);
    expect(resultado.cpf).toBe("52998224725");
  });

  it("normaliza o e-mail: sem espaços e em minúsculas", () => {
    const resultado = registerSchema.parse({ ...cadastroValido, email: "  Maria@Exemplo.COM " });
    expect(resultado.email).toBe("maria@exemplo.com");
  });

  it.each([
    ["dígito verificador errado", "529.982.247-26"],
    ["todos os dígitos iguais", "111.111.111-11"],
    ["tamanho errado", "529.982.247"],
  ])("recusa CPF com %s", (_caso, cpf) => {
    expect(errosDe(registerSchema, { ...cadastroValido, cpf })).toEqual({ cpf: "CPF inválido" });
  });

  it.each([
    ["menos de 8 caracteres", "leao190", "A senha deve ter no mínimo 8 caracteres"],
    ["sem letras", "12345678", "A senha deve conter letras"],
    ["sem números", "leaoleao", "A senha deve conter números"],
  ])("recusa senha %s (RNF04)", (_caso, senha, mensagem) => {
    expect(errosDe(registerSchema, { ...cadastroValido, senha })).toEqual({ senha: mensagem });
  });

  it("recusa data de nascimento fora do formato AAAA-MM-DD", () => {
    expect(errosDe(registerSchema, { ...cadastroValido, dataNascimento: "13/04/1995" })).toEqual({
      dataNascimento: "Use o formato AAAA-MM-DD",
    });
  });

  it("recusa data de nascimento no futuro", () => {
    expect(errosDe(registerSchema, { ...cadastroValido, dataNascimento: "2999-01-01" })).toEqual({
      dataNascimento: "Data de nascimento inválida",
    });
  });

  it("recusa nome curto demais", () => {
    expect(errosDe(registerSchema, { ...cadastroValido, nome: "Ma" })).toEqual({
      nome: "Informe seu nome completo",
    });
  });
});

describe("loginSchema", () => {
  it("exige e-mail válido e senha preenchida", () => {
    expect(errosDe(loginSchema, { email: "maria", senha: "" })).toEqual({
      email: "E-mail inválido",
      senha: "Informe a senha",
    });
  });
});

describe("compraSchema (ingressos)", () => {
  const compra = { jogoId: "j1", setorId: "s1", quantidade: 2 };

  it("aceita de 1 a 4 ingressos", () => {
    for (const quantidade of [1, 4]) {
      expect(compraSchema.safeParse({ ...compra, quantidade }).success).toBe(true);
    }
  });

  it.each([
    [0, "Escolha pelo menos 1 ingresso"],
    [5, "O limite é de 4 ingressos por compra"],
    [1.5, "Informe um número inteiro"],
  ])("recusa a quantidade %s", (quantidade, mensagem) => {
    expect(errosDe(compraSchema, { ...compra, quantidade })).toEqual({ quantidade: mensagem });
  });
});

describe("noticiaSchema", () => {
  const noticia = {
    titulo: "Sport vence o clássico",
    resumo: "Resumo com mais de dez caracteres.",
    conteudo: "Texto completo com pelo menos vinte caracteres.",
    categoria: "Profissional masculino",
    tipo: "Notícia",
  };

  it("cria como rascunho quando 'publicada' não é informado", () => {
    expect(noticiaSchema.parse(noticia).publicada).toBe(false);
  });

  it("só aceita as categorias e os tipos da lista fixa", () => {
    expect(errosDe(noticiaSchema, { ...noticia, categoria: "Futebol", tipo: "Fofoca" })).toEqual({
      categoria: "Escolha uma categoria",
      tipo: "Escolha um tipo",
    });
  });

  it("limita o título a 140 caracteres", () => {
    expect(errosDe(noticiaSchema, { ...noticia, titulo: "a".repeat(141) })).toEqual({
      titulo: "O título pode ter no máximo 140 caracteres",
    });
  });
});

describe("publicacaoSchema e contratarSchema", () => {
  it("exige 'publicada' como verdadeiro ou falso", () => {
    expect(publicacaoSchema.safeParse({ publicada: "sim" }).success).toBe(false);
    expect(publicacaoSchema.safeParse({ publicada: true }).success).toBe(true);
  });

  it("exige o plano escolhido", () => {
    expect(errosDe(contratarSchema, { planoId: "" })).toEqual({ planoId: "Escolha um plano" });
  });
});
