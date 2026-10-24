import { describe, expect, it } from "vitest";
import { exigirLogin } from "../../src/middlewares/exigirLogin";
import { exigirPapel } from "../../src/middlewares/exigirPapel";
import { criarNext, criarReq, criarRes } from "../apoio/express";
import { banco, filtrosEq } from "../apoio/supabaseFalso";

describe("exigirLogin", () => {
  it("responde 401 quando não há token", async () => {
    const res = criarRes();
    const next = criarNext();
    await exigirLogin(criarReq(), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.corpo).toEqual({ erro: "Token não informado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 quando o cabeçalho não usa o formato Bearer", async () => {
    banco.logar("token-ok", { id: "u1", email: "maria@exemplo.com" });
    const res = criarRes();
    await exigirLogin(criarReq({ authorization: "token-ok" }), res, criarNext());

    expect(res.statusCode).toBe(401);
  });

  it("responde 401 quando o Supabase recusa o token", async () => {
    const res = criarRes();
    const next = criarNext();
    await exigirLogin(criarReq({ authorization: "Bearer vencido" }), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.corpo).toEqual({ erro: "Token inválido ou expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("guarda o id e o e-mail do usuário em res.locals e segue", async () => {
    banco.logar("token-ok", { id: "u1", email: "maria@exemplo.com" });
    const res = criarRes();
    const next = criarNext();
    await exigirLogin(criarReq({ authorization: "Bearer token-ok" }), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals).toMatchObject({ usuarioId: "u1", email: "maria@exemplo.com" });
  });
});

describe("exigirPapel", () => {
  async function rodar(papelDoUsuario: string | null, ...permitidos: Parameters<typeof exigirPapel>) {
    banco.responder("perfis", { data: papelDoUsuario ? { papel: papelDoUsuario } : null });
    const res = criarRes();
    res.locals.usuarioId = "u1";
    const next = criarNext();
    await exigirPapel(...permitidos)(criarReq(), res, next);
    return { res, next };
  }

  it("deixa passar o perfil permitido e consulta o perfil do próprio usuário", async () => {
    const { res, next } = await rodar("editor", "editor");

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.papel).toBe("editor");
    expect(filtrosEq(banco.consultasA("perfis")[0])).toEqual({ id: "u1" });
  });

  it("deixa o admin passar em qualquer rota (permissões cumulativas)", async () => {
    const { next } = await rodar("admin", "editor");
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(["socio", "gestor"])("bloqueia com 403 o perfil %s numa rota só de editor", async (papel) => {
    const { res, next } = await rodar(papel, "editor");

    expect(res.statusCode).toBe(403);
    expect(res.corpo).toEqual({ erro: "Acesso negado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("bloqueia com 403 quando o perfil não existe", async () => {
    const { res } = await rodar(null, "editor");
    expect(res.statusCode).toBe(403);
  });

  it("falha do banco responde 500, não 'acesso negado', e não deixa passar", async () => {
    banco.responder("perfis", { data: null, error: { message: "timeout" } });
    const res = criarRes();
    res.locals.usuarioId = "u1";
    const next = criarNext();

    await exigirPapel("editor")(criarReq(), res, next);

    expect(res.statusCode).toBe(500);
    expect(res.corpo).toEqual({ erro: "Não foi possível verificar suas permissões", campos: undefined });
    expect(next).not.toHaveBeenCalled();
  });
});
