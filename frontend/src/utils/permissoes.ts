import type { Papel } from "../types/auth";

// O admin sempre pode (mesma regra do backend). Os demais, só se estiverem
// na lista de perfis permitidos.
export function podeAcessar(papel: Papel, permitidos: Papel[]) {
  return papel === "admin" || permitidos.includes(papel);
}

// Quem não é sócio comum trabalha no clube e vê o painel
export const temPainel = (papel: Papel) => papel !== "socio";