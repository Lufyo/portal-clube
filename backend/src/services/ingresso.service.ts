import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";
import type { CompraInput } from "../schemas/ingresso.schema";

const LIMITE_POR_JOGO = 4;

// Erros da função comprar_ingressos (banco) traduzidos para mensagens claras
const ERROS_DA_COMPRA: Record<
  string,
  { mensagem: string; status: number; campo?: string }
> = {
  QUANTIDADE_INVALIDA: { mensagem: "Escolha de 1 a 4 ingressos", status: 400, campo: "quantidade" },
  JOGO_NAO_ENCONTRADO: { mensagem: "Jogo não encontrado", status: 404 },
  SETOR_NAO_ENCONTRADO: { mensagem: "Setor não encontrado", status: 404, campo: "setorId" },
  VENDA_ENCERRADA: { mensagem: "A venda de ingressos para este jogo foi encerrada", status: 409 },
  LIMITE_EXCEDIDO: { mensagem: "O limite é de 4 ingressos por jogo", status: 409, campo: "quantidade" },
  SEM_LUGARES: { mensagem: "Não há lugares suficientes neste setor", status: 409, campo: "setorId" },
};

// Preço com desconto, arredondado em centavos (igual ao cálculo do banco)
const aplicarDesconto = (preco: number, desconto: number) =>
  Math.round(preco * (100 - desconto)) / 100;

const somar = (valores: number[]) =>
  Math.round(valores.reduce((total, v) => total + v, 0) * 100) / 100;

export async function dadosDeCompra(usuarioId: string, jogoId: string) {
  const { data: jogo, error: erroJogo } = await supabase
    .from("jogos")
    .select("id, adversario, data_hora, local_jogo, competicao, mandante, gols_clube")
    .eq("id", jogoId)
    .maybeSingle();

  // 22P02 = o id não tem formato de UUID; tratamos como "não encontrado"
  if (erroJogo && erroJogo.code !== "22P02") {
    console.error(erroJogo);
    throw new ErroDeNegocio("Não foi possível carregar o jogo", 500);
  }
  if (!jogo) throw new ErroDeNegocio("Jogo não encontrado", 404);

  const [setoresRes, perfilRes, jaCompradosRes] = await Promise.all([
    supabase
      .from("setores")
      .select("id, nome, preco, capacidade")
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("perfis")
      .select("plano:planos(desconto_ingresso)")
      .eq("id", usuarioId)
      .single(),
    supabase
      .from("ingressos")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuarioId)
      .eq("jogo_id", jogoId),
  ]);

  if (setoresRes.error || perfilRes.error || jaCompradosRes.error) {
    console.error(setoresRes.error, perfilRes.error, jaCompradosRes.error);
    throw new ErroDeNegocio("Não foi possível carregar os ingressos", 500);
  }

  const plano = perfilRes.data.plano as unknown as
    | { desconto_ingresso: number }
    | null;
  const desconto = plano?.desconto_ingresso ?? 0;

  // Conta os vendidos de cada setor neste jogo (só a contagem, sem trazer linhas)
  const setores = await Promise.all(
    setoresRes.data.map(async (setor) => {
      const { count, error } = await supabase
        .from("ingressos")
        .select("*", { count: "exact", head: true })
        .eq("jogo_id", jogoId)
        .eq("setor_id", setor.id);

      if (error) {
        console.error(error);
        throw new ErroDeNegocio("Não foi possível carregar os ingressos", 500);
      }

      return {
        id: setor.id,
        nome: setor.nome,
        preco: setor.preco,
        precoComDesconto: aplicarDesconto(setor.preco, desconto),
        disponiveis: Math.max(setor.capacidade - (count ?? 0), 0),
      };
    })
  );

  return {
    jogo: {
      id: jogo.id,
      adversario: jogo.adversario,
      data: jogo.data_hora,
      local: jogo.local_jogo,
      competicao: jogo.competicao,
      mandante: jogo.mandante,
      // A venda fecha na hora da partida ou quando já há resultado
      vendaAberta: new Date(jogo.data_hora) > new Date() && jogo.gols_clube === null,
    },
    desconto, // percentual do plano do sócio
    limiteRestante: Math.max(LIMITE_POR_JOGO - (jaCompradosRes.count ?? 0), 0),
    setores,
  };
}

export async function comprarIngressos(usuarioId: string, dados: CompraInput) {
  const { data, error } = await supabase.rpc("comprar_ingressos", {
    p_usuario: usuarioId, // sempre do token, nunca do corpo da requisição
    p_jogo: dados.jogoId,
    p_setor: dados.setorId,
    p_quantidade: dados.quantidade,
  });

  if (error) {
    // Id de jogo sem formato de UUID
    if (error.code === "22P02") {
      throw new ErroDeNegocio("Jogo não encontrado", 404);
    }
    const codigo = Object.keys(ERROS_DA_COMPRA).find((c) =>
      error.message.includes(c)
    );
    if (codigo) {
      const { mensagem, status, campo } = ERROS_DA_COMPRA[codigo];
      throw new ErroDeNegocio(mensagem, status, campo);
    }
    console.error(error);
    throw new ErroDeNegocio("Não foi possível concluir a compra", 500);
  }

  const ingressos = (data as {
    id: string;
    codigo: string;
    setor_id: string;
    preco_pago: number;
    criado_em: string;
  }[]).map((i) => ({
    id: i.id,
    codigo: i.codigo,
    setorId: i.setor_id,
    precoPago: i.preco_pago,
    criadoEm: i.criado_em,
  }));

  return { ingressos, total: somar(ingressos.map((i) => i.precoPago)) };
}

type LinhaIngresso = {
  id: string;
  codigo: string;
  preco_pago: number;
  criado_em: string;
  jogo: {
    id: string;
    adversario: string;
    data_hora: string;
    local_jogo: string;
    competicao: string;
    mandante: boolean;
  };
  setor: { id: string; nome: string };
};

export async function listarIngressos(usuarioId: string) {
  const { data, error } = await supabase
    .from("ingressos")
    .select(
      `id, codigo, preco_pago, criado_em,
       jogo:jogos(id, adversario, data_hora, local_jogo, competicao, mandante),
       setor:setores(id, nome)`
    )
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar seus ingressos", 500);
  }

  return (data as unknown as LinhaIngresso[]).map((i) => ({
    id: i.id,
    codigo: i.codigo,
    precoPago: i.preco_pago,
    criadoEm: i.criado_em,
    setor: i.setor.nome,
    jogo: {
      id: i.jogo.id,
      adversario: i.jogo.adversario,
      data: i.jogo.data_hora,
      local: i.jogo.local_jogo,
      competicao: i.jogo.competicao,
      mandante: i.jogo.mandante,
    },
  }));
}