// Formato que o GET /api/mensalidades devolve
export type Mensalidade = {
  id: string;
  referencia: string; // primeiro dia do mês cobrado: "2026-10-01"
  plano: string | null;
  valor: number;
  vencimento: string; // "2026-10-10"
  status: "pendente" | "paga";
  pagoEm: string | null; // data e hora do pagamento (ISO)
};