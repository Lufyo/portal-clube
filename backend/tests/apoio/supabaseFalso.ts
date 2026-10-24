import { vi } from "vitest";

// Supabase falso, para os testes não dependerem de um banco de verdade.
//
// Cada teste diz o que o "banco" responde, na ordem em que as consultas
// acontecem:
//
//   banco.responder("planos", { data: [{ id: "p1", nome: "Leão" }] });
//
// Toda consulta (supabase.from(tabela)...) consome a próxima resposta daquela
// tabela e fica registrada em banco.consultas, com as operações usadas
// (select, eq, update...), para o teste conferir os filtros.

export type Resultado = { data?: unknown; error?: unknown; count?: number | null };

export type Consulta = {
  tabela: string;
  operacoes: { metodo: string; argumentos: unknown[] }[];
};

type UsuarioDoToken = { id: string; email: string };

function criarBancoFalso() {
  const filas = new Map<string, Resultado[]>();
  const consultas: Consulta[] = [];
  const usuariosPorToken = new Map<string, UsuarioDoToken>();

  function proximaResposta(tabela: string): Resultado {
    const fila = filas.get(tabela) ?? [];
    const resposta = fila.shift();
    if (!resposta) {
      // Falha alta: o teste esqueceu de dizer o que o banco responde
      throw new Error(`Supabase falso: sem resposta configurada para a tabela "${tabela}"`);
    }
    return resposta;
  }

  function from(tabela: string) {
    const consulta: Consulta = { tabela, operacoes: [] };
    consultas.push(consulta);
    const resposta = proximaResposta(tabela);

    // Qualquer método encadeado (select, eq, order, single...) devolve a
    // própria consulta; o "await" no fim entrega a resposta configurada.
    const encadeavel: object = new Proxy(
      {},
      {
        get(_alvo, metodo) {
          if (metodo === "then") {
            const resultado = {
              data: resposta.data ?? null,
              error: resposta.error ?? null,
              count: resposta.count ?? null,
            };
            // Igual ao Supabase: .single() sem nenhuma linha é ERRO (PGRST116);
            // só o .maybeSingle() devolve null
            const usouSingle = consulta.operacoes.some((o) => o.metodo === "single");
            if (usouSingle && resultado.data === null && resultado.error === null) {
              resultado.error = {
                code: "PGRST116",
                message: "JSON object requested, multiple (or no) rows returned",
              };
            }
            return (resolver: (valor: unknown) => unknown, rejeitar?: (motivo: unknown) => unknown) =>
              Promise.resolve(resultado).then(resolver, rejeitar);
          }
          return (...argumentos: unknown[]) => {
            consulta.operacoes.push({ metodo: String(metodo), argumentos });
            return encadeavel;
          };
        },
      }
    );
    return encadeavel;
  }

  const cliente = {
    from: vi.fn(from),
    rpc: vi.fn(),
    auth: {
      // Token conhecido (cadastrado com banco.logar) → usuário; senão, erro
      getUser: vi.fn(async (token: string) => {
        const usuario = usuariosPorToken.get(token);
        return usuario
          ? { data: { user: usuario }, error: null }
          : { data: { user: null }, error: { message: "invalid JWT" } };
      }),
      signInWithPassword: vi.fn(),
      admin: { createUser: vi.fn(), deleteUser: vi.fn(), updateUserById: vi.fn() },
    },
  };

  return {
    cliente,
    consultas,

    responder(tabela: string, ...respostas: Resultado[]) {
      filas.set(tabela, [...(filas.get(tabela) ?? []), ...respostas]);
    },

    // Torna o token válido para o exigirLogin
    logar(token: string, usuario: UsuarioDoToken) {
      usuariosPorToken.set(token, usuario);
    },

    // Consultas feitas a uma tabela, na ordem em que aconteceram
    consultasA(tabela: string) {
      return consultas.filter((c) => c.tabela === tabela);
    },

    // Respostas configuradas que nenhuma consulta usou (ajuda a achar teste errado)
    respostasSobrando() {
      return [...filas.entries()].filter(([, fila]) => fila.length > 0).map(([tabela]) => tabela);
    },

    limpar() {
      filas.clear();
      consultas.length = 0;
      usuariosPorToken.clear();
      // Zera chamadas e respostas "Once" e volta cada vi.fn à implementação original
      vi.resetAllMocks();
    },
  };
}

export const banco = criarBancoFalso();

// Atalho: argumentos de cada .eq(coluna, valor) de uma consulta, como objeto
export function filtrosEq(consulta: Consulta) {
  return Object.fromEntries(
    consulta.operacoes.filter((o) => o.metodo === "eq").map((o) => o.argumentos)
  );
}
