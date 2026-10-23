import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { DadosCompra, RespostaCompra } from "../types/ingresso";

const mensagemDeErro = (e: unknown) =>
  e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.";

export function useCompraIngressos(jogoId: string | null) {
  const [dados, setDados] = useState<DadosCompra | null>(null);
  const [carregando, setCarregando] = useState(jogoId !== null);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [setorId, setSetorId] = useState("");
  const [quantidadePedida, setQuantidadePedida] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [compra, setCompra] = useState<RespostaCompra | null>(null);

  const carregar = useCallback(async () => {
    if (!jogoId) return;
    try {
      setDados(await api<DadosCompra>(`/ingressos/jogos/${jogoId}`));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }, [jogoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Setor escolhido; se ainda não escolheu, o primeiro que tenha lugares
  const setorSelecionado =
    dados?.setores.find((s) => s.id === setorId) ??
    dados?.setores.find((s) => s.disponiveis > 0) ??
    null;

  // Máximo que dá para comprar agora: limite do jogo e lugares do setor
  const maxQuantidade = dados
    ? Math.min(dados.limiteRestante, setorSelecionado?.disponiveis ?? 0)
    : 0;

  const quantidade = Math.min(quantidadePedida, maxQuantidade);

  // Total em centavos, para não acumular erro de arredondamento
  const total = setorSelecionado
    ? Math.round(setorSelecionado.precoComDesconto * 100) * quantidade / 100
    : 0;

  async function comprar() {
    if (!dados || !setorSelecionado || quantidade < 1) return;

    setComprando(true);
    setErro(null);
    setErrosCampos({});
    setCompra(null);

    try {
      const resposta = await api<RespostaCompra>("/ingressos", {
        metodo: "POST",
        corpo: {
          jogoId: dados.jogo.id,
          setorId: setorSelecionado.id,
          quantidade,
        },
      });
      setCompra(resposta);
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Erro inesperado. Tente novamente.");
      }
    } finally {
      setComprando(false);
      // Atualiza lugares disponíveis e o limite, com sucesso ou não
      await carregar();
    }
  }

  return {
    dados,
    carregando,
    erro,
    errosCampos,
    setorSelecionado,
    escolherSetor: setSetorId,
    quantidade,
    maxQuantidade,
    escolherQuantidade: setQuantidadePedida,
    total,
    comprando,
    compra,
    comprar,
  };
}