// Formato que o GET /api/planos devolve
export type Plano = {
  id: string;
  nome: string;
  preco: number; // valor mensal em reais
  beneficios: string[];
  destaque: boolean; // marca o plano "Mais popular"
};