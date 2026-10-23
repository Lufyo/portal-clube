const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";
const CHAVE_TOKEN = "portal_token";

// Token guardado no localStorage: o sócio continua logado ao recarregar a página
export const guardarToken = (token: string) =>
  localStorage.setItem(CHAVE_TOKEN, token);
export const lerToken = () => localStorage.getItem(CHAVE_TOKEN);
export const removerToken = () => localStorage.removeItem(CHAVE_TOKEN);

// Erro lançado quando a API responde com falha.
// "campos" traz os erros por campo do formulário, como no contrato da API.
export class ApiError extends Error {
  status: number;
  campos?: Record<string, string>;

  constructor(mensagem: string, status: number, campos?: Record<string, string>) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

type Opcoes = {
  metodo?: "GET" | "POST";
  corpo?: unknown;
};

// Função única para chamar a API. O <T> diz qual formato de resposta esperamos.
export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const token = lerToken();

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers: {
        ...(opcoes.corpo ? { "Content-Type": "application/json" } : {}),
        // Se houver token, ele vai em todas as chamadas
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    // Servidor desligado ou sem internet (RNF06: mensagem em linguagem clara)
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.", 0);
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new ApiError(dados?.erro ?? "Erro inesperado", resposta.status, dados?.campos);
  }
  return dados as T;
}