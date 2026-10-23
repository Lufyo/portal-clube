// Formato que o GET /api/jogos devolve
export type Jogo = {
  id: string;
  adversario: string;
  data: string; // data e hora em formato ISO
  local: string;
  competicao: string;
  mandante: boolean; // true = o clube joga em casa
  // Só existe em jogos já disputados
  resultado?: {
    golsClube: number;
    golsAdversario: number;
  };
};