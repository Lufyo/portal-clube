export type Papel = "socio" | "editor" | "gestor" | "admin";

// Dados do usuário logado, guardados no AuthContext
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
};

export type RespostaLogin = {
  token: string;
  usuario: Usuario;
};

// Formato do GET /api/auth/me
export type Perfil = {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string; // formato AAAA-MM-DD
  numeroSocio: number;
  papel: Papel;
  email: string;
  // null quando o sócio ainda não contratou um plano
  plano: { id: string; nome: string; preco: number } | null;
};