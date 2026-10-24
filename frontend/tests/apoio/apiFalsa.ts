import { vi } from "vitest";

// API falsa no lugar do fetch, para testar as telas sem o backend.
//
//   apiFalsa.responder("GET", "/mensalidades", 200, [ ... ]);
//
// Cada chamada consome a próxima resposta daquela rota; chamada sem
// resposta configurada falha o teste. As chamadas feitas ficam em
// apiFalsa.chamadas, com o método, o caminho, os cabeçalhos e o corpo.

type Chamada = { metodo: string; caminho: string; cabecalhos: Record<string, string>; corpo: unknown };
type Resposta = { status: number; corpo: unknown } | { falhaDeRede: true };

const BASE = "http://localhost:3333/api";

function criarApiFalsa() {
  const respostas = new Map<string, Resposta[]>();
  const chamadas: Chamada[] = [];

  const fetchFalso = vi.fn(async (url: string, init: RequestInit = {}) => {
    const metodo = init.method ?? "GET";
    const caminho = url.replace(BASE, "");
    chamadas.push({
      metodo,
      caminho,
      cabecalhos: (init.headers ?? {}) as Record<string, string>,
      corpo: init.body ? JSON.parse(String(init.body)) : undefined,
    });

    const chave = `${metodo} ${caminho}`;
    const resposta = respostas.get(chave)?.shift();
    if (!resposta) throw new Error(`API falsa: sem resposta configurada para ${chave}`);
    if ("falhaDeRede" in resposta) throw new TypeError("Failed to fetch");

    return new Response(JSON.stringify(resposta.corpo), {
      status: resposta.status,
      headers: { "Content-Type": "application/json" },
    });
  });

  return {
    chamadas,
    fetch: fetchFalso,

    responder(metodo: string, caminho: string, status: number, corpo: unknown) {
      const chave = `${metodo} ${caminho}`;
      respostas.set(chave, [...(respostas.get(chave) ?? []), { status, corpo }]);
    },

    // Simula servidor desligado ou sem internet
    falharRede(metodo: string, caminho: string) {
      const chave = `${metodo} ${caminho}`;
      respostas.set(chave, [...(respostas.get(chave) ?? []), { falhaDeRede: true }]);
    },

    chamadasA(metodo: string, caminho: string) {
      return chamadas.filter((c) => c.metodo === metodo && c.caminho === caminho);
    },

    limpar() {
      respostas.clear();
      chamadas.length = 0;
      fetchFalso.mockClear();
    },
  };
}

export const apiFalsa = criarApiFalsa();
