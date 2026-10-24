import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";
import type { ExclusaoDeContaInput } from "../schemas/auth.schema";
import { senhaConfere } from "./auth.service";
import { cobrancaDoMesAtual, removerCobrancasFuturas } from "./mensalidade.service";

// Direitos do titular na LGPD (art. 18): acesso e portabilidade dos dados
// (exportarDados) e eliminação (excluirConta).

// Sem os tipos gerados do banco, o supabase-js trata as relações como listas;
// cada linha aponta para um plano, um jogo e um setor só (objeto ou null).
type LinhaPerfil = {
  nome: string;
  cpf: string;
  data_nascimento: string;
  numero_socio: number;
  papel: string;
  criado_em: string;
  plano: { nome: string; preco_mensal: number } | null;
};

type LinhaMensalidade = {
  referencia: string;
  valor: number;
  vencimento: string;
  status: string;
  pago_em: string | null;
  plano: { nome: string } | null;
};

type Jogo = { adversario: string; data_hora: string; local_jogo: string; competicao: string };

type LinhaIngresso = {
  codigo: string;
  preco_pago: number;
  criado_em: string;
  jogo: Jogo & { mandante?: boolean };
  setor: { nome: string } | null;
};

// Tudo o que o portal guarda sobre o sócio, num formato legível
export async function exportarDados(usuarioId: string, email: string) {
  const [perfilRes, mensalidadesRes, ingressosRes] = await Promise.all([
    supabase
      .from("perfis")
      .select("nome, cpf, data_nascimento, numero_socio, papel, criado_em, plano:planos(nome, preco_mensal)")
      .eq("id", usuarioId)
      .maybeSingle(),
    supabase
      .from("mensalidades")
      .select("referencia, valor, vencimento, status, pago_em, plano:planos(nome)")
      .eq("usuario_id", usuarioId)
      .order("referencia", { ascending: false }),
    supabase
      .from("ingressos")
      .select("codigo, preco_pago, criado_em, jogo:jogos(adversario, data_hora, local_jogo, competicao, mandante), setor:setores(nome)")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false }),
  ]);

  if (perfilRes.error || mensalidadesRes.error || ingressosRes.error || !perfilRes.data) {
    console.error(perfilRes.error, mensalidadesRes.error, ingressosRes.error);
    throw new ErroDeNegocio("Não foi possível reunir seus dados", 500);
  }

  const perfil = perfilRes.data as unknown as LinhaPerfil;
  const mensalidades = (mensalidadesRes.data ?? []) as unknown as LinhaMensalidade[];
  const ingressos = (ingressosRes.data ?? []) as unknown as LinhaIngresso[];

  return {
    geradoEm: new Date().toISOString(),
    titular: {
      nome: perfil.nome,
      email,
      cpf: perfil.cpf,
      dataNascimento: perfil.data_nascimento,
      numeroSocio: perfil.numero_socio,
      perfil: perfil.papel,
      cadastradoEm: perfil.criado_em,
    },
    plano: perfil.plano ? { nome: perfil.plano.nome, precoMensal: perfil.plano.preco_mensal } : null,
    mensalidades: mensalidades.map((m) => ({
      referencia: m.referencia,
      plano: m.plano?.nome ?? null,
      valor: m.valor,
      vencimento: m.vencimento,
      status: m.status,
      pagoEm: m.pago_em,
    })),
    ingressos: ingressos.map((i) => ({
      codigo: i.codigo,
      // O time da casa primeiro, como no resto do portal
      jogo: i.jogo.mandante === false ? `${i.jogo.adversario} x Sport` : `Sport x ${i.jogo.adversario}`,
      data: i.jogo.data_hora,
      local: i.jogo.local_jogo,
      competicao: i.jogo.competicao,
      setor: i.setor?.nome ?? null,
      valorPago: i.preco_pago,
      compradoEm: i.criado_em,
    })),
  };
}

// "pague a mensalidade em aberto" / "pague as 3 mensalidades em aberto"
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios.replace("{n}", String(n)));

// Excluir a conta: o login some e o perfil é anonimizado. O histórico de
// mensalidades e ingressos fica, sem identificar a pessoa, porque o clube
// precisa dele para a contabilidade (a LGPD permite guardar o necessário para
// cumprir obrigações legais). Com mensalidade devida ou ingresso para jogo
// futuro, a exclusão é bloqueada até a pendência ser resolvida.
export async function excluirConta(usuarioId: string, email: string, dados: ExclusaoDeContaInput) {
  if (!(await senhaConfere(email, dados.senhaAtual))) {
    throw new ErroDeNegocio("Senha incorreta", 400, "senhaAtual");
  }

  // Pendências: mensalidade não paga do mês atual ou de antes (quem foi sócio
  // no mês deve o mês) e ingresso para jogo que ainda não aconteceu
  const [dividasRes, ingressosRes] = await Promise.all([
    supabase
      .from("mensalidades")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuarioId)
      .eq("status", "pendente")
      .lte("referencia", cobrancaDoMesAtual().referencia),
    supabase.from("ingressos").select("id, jogo:jogos(data_hora)").eq("usuario_id", usuarioId),
  ]);

  if (dividasRes.error || ingressosRes.error) {
    console.error(dividasRes.error, ingressosRes.error);
    throw new ErroDeNegocio("Não foi possível excluir a conta", 500);
  }

  const dividas = dividasRes.count ?? 0;
  const agora = new Date();
  const jogosFuturos = ((ingressosRes.data ?? []) as unknown as { jogo: { data_hora: string } }[]).filter(
    (i) => new Date(i.jogo.data_hora) > agora
  ).length;

  if (dividas > 0 || jogosFuturos > 0) {
    const falta = [
      dividas > 0 && plural(dividas, "pague a mensalidade em aberto", "pague as {n} mensalidades em aberto"),
      jogosFuturos > 0 &&
        plural(jogosFuturos, "aguarde o jogo com ingresso comprado", "aguarde os {n} jogos com ingresso comprado"),
    ].filter(Boolean);
    throw new ErroDeNegocio(`Para excluir a conta, ${falta.join(" e ")}.`, 409);
  }

  // Cobranças de meses que ainda não começaram deixam de existir, como no cancelamento
  await removerCobrancasFuturas(usuarioId);

  // CPF e data de nascimento são obrigatórios no banco: viram valores que não
  // identificam ninguém (o CPF precisa ser único, por isso leva o id)
  const { error: erroPerfil } = await supabase
    .from("perfis")
    .update({ nome: "Sócio removido", cpf: `removido-${usuarioId}`, data_nascimento: "1900-01-01", plano_id: null })
    .eq("id", usuarioId);

  if (erroPerfil) {
    console.error(erroPerfil);
    throw new ErroDeNegocio("Não foi possível excluir a conta", 500);
  }

  // Exclusão "suave" do login: o Supabase apaga o e-mail e impede o acesso,
  // mas mantém o registro, então o histórico ligado a ele não é apagado em cascata.
  // Vem por último: se falhar, a pessoa ainda consegue entrar e tentar de novo.
  const { error: erroAuth } = await supabase.auth.admin.deleteUser(usuarioId, true);
  if (erroAuth) {
    console.error(erroAuth);
    throw new ErroDeNegocio("Não foi possível excluir a conta", 500);
  }
}
