const CHAVE = "portal_plano_escolhido";

export const guardarPlanoEscolhido = (id: string) =>
  sessionStorage.setItem(CHAVE, id);
export const lerPlanoEscolhido = () => sessionStorage.getItem(CHAVE);
export const limparPlanoEscolhido = () => sessionStorage.removeItem(CHAVE);