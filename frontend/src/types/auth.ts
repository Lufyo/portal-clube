// Formato dos dados que a API devolve (conforme o contrato da Etapa 11)
export type Usuario = {
  id: string;
  nome: string;
  email: string;
};

export type RespostaLogin = {
  token: string;
  usuario: Usuario;
};

export type Perfil = {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string; // formato AAAA-MM-DD
  numeroSocio: number;
  email: string;
  // null quando o sócio ainda não contratou um plano
  plano: { id: string; nome: string; preco: number } | null;
};