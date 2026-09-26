export interface AnaliseFaixa {
  faixaIndex: number; // 0 a 19
  inicio: number;     // ex: 1
  fim: number;        // ex: 5
  quantidadeMarcada: number;
  tipo: 'VACUO_TOTAL' | 'DANO_TOLERAVEL' | 'ATIVA'; // 0, 1 ou 2+
}

export interface AssinaturaCartela {
  id: string | number;
  nome: string;
  totalMarcadas: number;
  faixas: AnaliseFaixa[];
  totalVacuosTotais: number;      // quantas faixas com 0
  totalDanosToleraveis: number;  // quantas faixas com 1
  indicesVacuo: number[];         // quais faixas estão 100% vazias
  indicesDano: number[];          // quais faixas têm só 1
}

export interface ComparacaoRedundancia {
  cartelaA: string | number;
  cartelaB: string | number;
  vacuosCompartilhados: number[]; // faixas vazias em ambas
  similaridadePorcentagem: number;
}

// Converte qualquer cartela (array de números de 00 a 99 ou 01 a 100) em assinatura geométrica
export function extrairAssinatura(cartela: number[], id: string | number, nome: string): AssinaturaCartela {
  const faixas: AnaliseFaixa[] = [];
  const setNumeros = new Set(cartela);

  for (let f = 0; f < 20; f++) {
    // 20 faixas de 5 números (0 a 4, 5 a 9... ou 1 a 5, 6 a 10...)
    // Ajustado para padrão 00 a 99 (ou se for 1 a 100, soma 1):
    const inicio = f * 5;
    const fim = inicio + 4;
    let marcadas = 0;

    for (let n = inicio; n <= fim; n++) {
      if (setNumeros.has(n)) marcadas++;
    }

    let tipo: AnaliseFaixa['tipo'] = 'ATIVA';
    if (marcadas === 0) tipo = 'VACUO_TOTAL';
    else if (marcadas === 1) tipo = 'DANO_TOLERAVEL';

    faixas.push({ faixaIndex: f, inicio, fim, quantidadeMarcada: marcadas, tipo });
  }

  const vacuos = faixas.filter(f => f.tipo === 'VACUO_TOTAL').map(f => f.faixaIndex);
  const danos = faixas.filter(f => f.tipo === 'DANO_TOLERAVEL').map(f => f.faixaIndex);

  return {
    id,
    nome,
    totalMarcadas: cartela.length,
    faixas,
    totalVacuosTotais: vacuos.length,
    totalDanosToleraveis: danos.length,
    indicesVacuo: vacuos,
    indicesDano: danos,
  };
}

// Analisa redundância: descobre quais cartelas sacrificaram exatamente as mesmas faixas
export function calcularRedundancias(assinaturas: AssinaturaCartela[]): ComparacaoRedundancia[] {
  const resultado: ComparacaoRedundancia[] = [];

  for (let i = 0; i < assinaturas.length; i++) {
    for (let j = i + 1; j < assinaturas.length; j++) {
      const a = assinaturas[i];
      const b = assinaturas[j];

      const comuns = a.indicesVacuo.filter(faixa => b.indicesVacuo.includes(faixa));
      const totalVacuosUnicos = new Set([...a.indicesVacuo, ...b.indicesVacuo]).size;
      const similaridade = totalVacuosUnicos === 0 ? 0 : Math.round((comuns.length / totalVacuosUnicos) * 100);

      resultado.push({
        cartelaA: a.nome,
        cartelaB: b.nome,
        vacuosCompartilhados: comuns,
        similaridadePorcentagem: similaridade,
      });
    }
  }

  return resultado.sort((a, b) => b.similaridadePorcentagem - a.similaridadePorcentagem);
}