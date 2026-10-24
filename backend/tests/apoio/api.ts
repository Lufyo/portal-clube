import request from "supertest";
import { app } from "../../src/app";
import { banco } from "./supabaseFalso";

// Cliente HTTP de teste: as requisições passam por todo o caminho real
// (rota → middlewares → controller → service), só o banco é falso.
export const api = () => request(app);

type Papel = "socio" | "editor" | "gestor" | "admin";

// Prepara um usuário logado e devolve o cabeçalho Authorization.
// Com "papel", também responde a consulta do middleware exigirPapel.
export function entrarComo(usuarioId: string, papel?: Papel) {
  const token = `token-${usuarioId}`;
  banco.logar(token, { id: usuarioId, email: `${usuarioId}@exemplo.com` });
  if (papel) banco.responder("perfis", { data: { papel } });
  return { Authorization: `Bearer ${token}` };
}
