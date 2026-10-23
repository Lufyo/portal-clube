// Formato do GET /api/ingressos/jogos/:jogoId
export type SetorIngresso = {
  id: string;
  nome: string;
  preco: number;
  precoComDesconto: number;
  disponiveis: number;
};

export type DadosCompra = {
  jogo: {
    id: string;
    adversario: string;
    data: string; // data e hora em formato ISO
    local: string;
    competicao: string;
    mandante: boolean;
    vendaAberta: boolean;
  };
  desconto: number; // percentual do plano do sócio (0 se não tem plano)
  limiteRestante: number; // quantos ingressos ainda pode comprar neste jogo
  setores: SetorIngresso[];
};

// Formato do POST /api/ingressos
export type IngressoComprado = {
  id: string;
  codigo: string;
  setorId: string;
  precoPago: number;
  criadoEm: string;
};

export type RespostaCompra = {
  mensagem: string;
  ingressos: IngressoComprado[];
  total: number;
};

// Formato do GET /api/ingressos (ingressos do usuário logado)
export type MeuIngresso = {
  id: string;
  codigo: string;
  precoPago: number;
  criadoEm: string;
  setor: string; // nome do setor
  jogo: {
    id: string;
    adversario: string;
    data: string; // data e hora em formato ISO
    local: string;
    competicao: string;
    mandante: boolean;
  };
};