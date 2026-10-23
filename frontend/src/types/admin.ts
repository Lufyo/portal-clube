// Formato do GET /api/admin/resumo
export type Resumo = {
  cadastros: number;
  sociosComPlano: number;
  mensalidadesPendentes: number;
  noticiasPublicadas: number;
  jogos: number;
};