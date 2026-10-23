import { supabase } from "../config/supabase";
import { ErroDeNegocio } from "../errors/ErroDeNegocio";

export async function listarJogos() {
  const { data, error } = await supabase
    .from("jogos")
    .select(
      "id, adversario, data_hora, local_jogo, competicao, mandante, gols_clube, gols_adversario"
    )
    .order("data_hora", { ascending: true }); // do mais antigo ao mais novo

  if (error) {
    console.error(error);
    throw new ErroDeNegocio("Não foi possível carregar os jogos", 500);
  }

  // Converte para o formato da API (o mesmo que o frontend já usa)
  return data.map((jogo) => ({
    id: jogo.id,
    adversario: jogo.adversario,
    data: jogo.data_hora,
    local: jogo.local_jogo,
    competicao: jogo.competicao,
    mandante: jogo.mandante,
    // Só existe resultado quando o jogo já foi disputado.
    // Com undefined, o campo nem aparece no JSON.
    resultado:
      jogo.gols_clube === null
        ? undefined
        : { golsClube: jogo.gols_clube, golsAdversario: jogo.gols_adversario },
  }));
}