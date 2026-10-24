import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";

const DIA_VENCIMENTO = "10";

// Data de hoje no Brasil, no formato AAAA-MM-DD.
// Evita erro de mês quando o servidor roda em UTC.
function hojeNoBrasil() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

// Cobrança de um mês: referência no dia 1º e vencimento no dia 10
function cobrancaDoMes(ano: number, mes: number) {
  const aaaaMm = `${ano}-${String(mes).padStart(2, "0")}`;
  return { referencia: `${aaaaMm}-01`, vencimento: `${aaaaMm}-${DIA_VENCIMENTO}` };
}

// Cobrança do mês corrente no Brasil
export function cobrancaDoMesAtual() {
  const [ano, mes] = hojeNoBrasil().split("-").map(Number);
  return cobrancaDoMes(ano, mes);
}

// Grava a cobrança; se a do mês já existe, não faz nada (nem sobrescreve)
async function gravarCobranca(
  usuarioId: string,
  plano: { id: string; preco_mensal: number },
  cobranca: { referencia: string; vencimento: string }
) {
  const { error } = await supabase.from("mensalidades").upsert(
    { usuario_id: usuarioId, plano_id: plano.id, valor: plano.preco_mensal, ...cobranca },
    { onConflict: "usuario_id,referencia", ignoreDuplicates: true }
  );

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível gerar a mensalidade", 500);
  }
}

// Primeira cobrança de quem acabou de assinar. Até o dia do vencimento, é a do
// mês atual; depois dele, a do mês seguinte, para ninguém já nascer em atraso.
export async function gerarPrimeiraMensalidade(
  usuarioId: string,
  plano: { id: string; preco_mensal: number }
) {
  const [ano, mes, dia] = hojeNoBrasil().split("-").map(Number);
  const cobranca =
    dia <= Number(DIA_VENCIMENTO)
      ? cobrancaDoMes(ano, mes)
      : mes === 12
        ? cobrancaDoMes(ano + 1, 1)
        : cobrancaDoMes(ano, mes + 1);

  await gravarCobranca(usuarioId, plano, cobranca);
}

// Garante a cobrança do mês atual de quem tem plano. Usada ao listar as
// mensalidades e ao cancelar o plano (quem foi sócio no mês, deve o mês).
export async function garantirCobrancaDoMes(
  usuarioId: string,
  plano: { id: string; preco_mensal: number }
) {
  const doMes = cobrancaDoMesAtual();

  // Cobrança de um mês seguinte já existe quando o sócio assinou depois do
  // vencimento (ver gerarPrimeiraMensalidade): o mês da assinatura não é cobrado
  const { count, error } = await supabase
    .from("mensalidades")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .gt("referencia", doMes.referencia);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar as mensalidades", 500);
  }
  if (!count) {
    await gravarCobranca(usuarioId, plano, doMes);
  }
}

// Sem os tipos gerados do banco, o supabase-js trata "plano:planos(...)" como
// lista. Perfil e mensalidade apontam para um plano só: chega objeto (ou null).
export type PlanoDoPerfil = { plano: { id: string; preco_mensal: number } | null };

type LinhaMensalidade = {
  id: string;
  referencia: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "paga";
  pago_em: string | null;
  plano: { nome: string } | null;
};

export async function listarMensalidades(usuarioId: string) {
  // 1. Descobre o plano atual do sócio
  // maybeSingle: perfil inexistente chega como null (e não como erro), então
  // "error" aqui é sempre falha do banco
  const { data: dadosPerfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("plano:planos(id, preco_mensal)")
    .eq("id", usuarioId)
    .maybeSingle();
  const perfil = dadosPerfil as unknown as PlanoDoPerfil | null;

  if (erroPerfil) {
    console.error(erroPerfil);
    throw new ErroDeNegocio("Não foi possível carregar as mensalidades", 500);
  }
  if (!perfil) {
    throw new ErroDeNegocio("Perfil não encontrado", 404);
  }

  // 2. Se tem plano, garante a cobrança do mês atual
  if (perfil.plano) {
    await garantirCobrancaDoMes(usuarioId, perfil.plano);
  }

  // 3. Lista todas, da mais recente para a mais antiga
  const { data, error } = await supabase
    .from("mensalidades")
    .select("id, referencia, valor, vencimento, status, pago_em, plano:planos(nome)")
    .eq("usuario_id", usuarioId)
    .order("referencia", { ascending: false });

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar as mensalidades", 500);
  }

  // Formato da API (camelCase)
  return (data as unknown as LinhaMensalidade[]).map((m) => ({
    id: m.id,
    referencia: m.referencia,
    plano: m.plano?.nome ?? null,
    valor: m.valor,
    vencimento: m.vencimento,
    status: m.status,
    pagoEm: m.pago_em,
  }));
}

export async function pagarMensalidade(usuarioId: string, id: string) {
  // O filtro por usuario_id garante que o sócio só paga as próprias mensalidades
  const { data: mensalidade, error: erroBusca } = await supabase
    .from("mensalidades")
    .select("id, status")
    .eq("id", id)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  // Falha do banco não pode virar "mensalidade não encontrada".
  // 22P02 = o id não tem formato de UUID; tratamos como "não encontrada".
  if (erroBusca && erroBusca.code !== "22P02") {
    console.error(erroBusca);
    throw new ErroDeNegocio("Não foi possível registrar o pagamento", 500);
  }
  if (!mensalidade) {
    throw new ErroDeNegocio("Mensalidade não encontrada", 404);
  }
  if (mensalidade.status === "paga") {
    throw new ErroDeNegocio("Esta mensalidade já foi paga", 409);
  }

  // Pagamento simulado: apenas registra que foi paga, sem gateway real
  const { error } = await supabase
    .from("mensalidades")
    .update({ status: "paga", pago_em: new Date().toISOString() })
    .eq("id", id)
    .eq("usuario_id", usuarioId);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível registrar o pagamento", 500);
  }
}

// Troca de plano: as cobranças ainda não pagas do mês atual em diante passam
// para o plano novo, com o preço novo. As de meses anteriores continuam
// devidas com o valor de antes: trocar de plano não apaga dívida.
export async function reajustarPendentes(
  usuarioId: string,
  plano: { id: string; preco_mensal: number }
) {
  const { error } = await supabase
    .from("mensalidades")
    .update({ plano_id: plano.id, valor: plano.preco_mensal })
    .eq("usuario_id", usuarioId)
    .eq("status", "pendente")
    .gte("referencia", cobrancaDoMesAtual().referencia);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível atualizar as mensalidades", 500);
  }
}

// Cancelamento: apaga só as cobranças de meses que ainda não começaram. O mês
// atual e os anteriores continuam devidos, e as pagas ficam como histórico.
export async function removerCobrancasFuturas(usuarioId: string) {
  const { error } = await supabase
    .from("mensalidades")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("status", "pendente")
    .gt("referencia", cobrancaDoMesAtual().referencia);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível atualizar as mensalidades", 500);
  }
}
