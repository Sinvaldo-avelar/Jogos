// Salva um novo resultado da Lotomania
export async function salvarResultadoLotomania({ concurso, data, numeros }) {
  const { data: result, error } = await supabase
    .from("lotomania_resultados")
    .insert([{ concurso, data, numeros }]);
  if (error) throw error;
  return result;
}

// Busca todos os resultados cadastrados
export async function buscarResultadosLotomania() {
  const { data, error } = await supabase
    .from("lotomania_resultados")
    .select("id, concurso, data, numeros")
    .order("concurso", { ascending: false });
  if (error) throw error;
  return data;
}
import { supabase } from "../lib/supabaseClient";

// Salva um novo jogo da Lotomania
export async function salvarJogo(numeros) {
  const { data, error } = await supabase
    .from("lotomania_jogos")
    .insert([{ numeros }]);
  if (error) throw error;
  return data;
}

// Busca todos os jogos salvos
export async function buscarJogos() {
  const { data, error } = await supabase
    .from("lotomania_jogos")
    .select("id, numeros, criado_em");
  if (error) throw error;
  return data;
}

// Apaga um jogo pelo id
export async function apagarJogo(id) {
  const { error } = await supabase
    .from("lotomania_jogos")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
