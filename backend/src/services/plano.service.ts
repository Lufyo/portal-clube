import { removerMensalidadesPendentes } from "./mensalidade.service";
import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";

export async function listarPlanos() {
  const { data, error } = await supabase
    .from("planos")
    .select("id, nome, preco_mensal, beneficios, destaque")
    .eq("ativo", true)
    .order("preco_mensal"); // do mais barato ao mais caro

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar os planos", 500);
  }

  // Mantém o mesmo formato que o frontend já usa (preco, em vez de preco_mensal)
  return data.map((plano) => ({
    id: plano.id,
    nome: plano.nome,
    preco: plano.preco_mensal,
    beneficios: plano.beneficios,
    destaque: plano.destaque,
  }));
}

export async function contratarPlano(usuarioId: string, planoId: string) {
  // Confere se o plano existe e está ativo
  const { data: plano, error: erroPlano } = await supabase
    .from("planos")
    .select("id, nome")
    .eq("id", planoId)
    .eq("ativo", true)
    .maybeSingle();

  // Falha do banco não pode virar "plano não encontrado".
  // 22P02 = o id não tem formato de UUID; tratamos como "não encontrado".
  if (erroPlano && erroPlano.code !== "22P02") {
    console.error(erroPlano);
    throw new ErroDeNegocio("Não foi possível contratar o plano", 500);
  }
  if (!plano) {
    throw new ErroDeNegocio("Plano não encontrado", 404, "planoId");
  }

  // Contratar e trocar de plano são a mesma operação: grava o plano no perfil
  const { error } = await supabase
    .from("perfis")
    .update({ plano_id: plano.id })
    .eq("id", usuarioId);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível contratar o plano", 500);
  }

  // A cobrança do novo plano será recriada quando o sócio abrir as mensalidades
  await removerMensalidadesPendentes(usuarioId);

  return { id: plano.id, nome: plano.nome };
}

export async function cancelarPlano(usuarioId: string) {
  const { error } = await supabase
    .from("perfis")
    .update({ plano_id: null })
    .eq("id", usuarioId);

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível cancelar o plano", 500);
  }

  await removerMensalidadesPendentes(usuarioId);
}