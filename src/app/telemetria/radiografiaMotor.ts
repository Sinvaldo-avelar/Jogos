export const COLUNAS_QTD = 5;
export const LINHAS_QTD = 20;
export const TOTAL_CASAS = 100;

export interface RadiografiaCartela {
  id: number | string;
  numeroCartela: number;
  selecionadas: number[][]; // Matriz 20x5
  dezenas: number[];        // Lista com os números (1 a 100)
  totalDezenas: number;
  
  // Eixo Horizontal (20 Linhas)
  linhasPontos: number[];   // Qtd de pontos em cada linha (0 a 5)
  linhasVazias: number[];   // Índices das linhas com 0
  linhasCom1: number[];     // Índices das linhas com 1
  linhasCom2Plus: number[]; // Linhas com 2 ou mais

  // Eixo Vertical (5 Colunas)
  colunasPontos: number[];  // Qtd de pontos em cada coluna (ex: [10, 8, 12, 11, 9])
  
  // Geometria & Agrupamento (Aglomerados e Ilhas)
  dezenasColadas: number;   // Quantas dezenas têm pelo menos 1 vizinha colada
  maiorIlhaContigua: number; // Tamanho do maior bloco compacto contíguo
}

/**
 * Calcula a radiografia geométrica e estatística completa de uma cartela.
 */
export function analisarCartela(
  c: any, 
  index: number
): RadiografiaCartela {
  const matriz: number[][] = Array.isArray(c.selecionadas)
    ? c.selecionadas
    : Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0));

  const dezenas: number[] = [];
  const linhasPontos = Array(LINHAS_QTD).fill(0);
  const colunasPontos = Array(COLUNAS_QTD).fill(0);

  // Mapa binário 20x5 para busca de vizinhança rápida (1 = marcada, 0 = vazia)
  const grid = Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0));

  for (let l = 0; l < LINHAS_QTD; l++) {
    for (let col = 0; col < COLUNAS_QTD; col++) {
      const val = matriz[l]?.[col];
      if (val === 1 || val === 2) {
        grid[l][col] = 1;
        linhasPontos[l]++;
        colunasPontos[col]++;
        const numReal = l * COLUNAS_QTD + col + 1;
        dezenas.push(numReal);
      }
    }
  }

  const linhasVazias: number[] = [];
  const linhasCom1: number[] = [];
  const linhasCom2Plus: number[] = [];

  linhasPontos.forEach((qtd, idx) => {
    if (qtd === 0) linhasVazias.push(idx);
    else if (qtd === 1) linhasCom1.push(idx);
    else linhasCom2Plus.push(idx);
  });

  // Cálculo de Ilhas e Vizinhos Conectados (Geometria espacial)
  let dezenasColadas = 0;
  const visitados = Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(false));
  let maiorIlhaContigua = 0;

  // Direções ortogonais e diagonais
  const deltas = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // Cima, Baixo, Esquerda, Direita
    [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonais
  ];

  for (let l = 0; l < LINHAS_QTD; l++) {
    for (let col = 0; col < COLUNAS_QTD; col++) {
      if (grid[l][col] === 1) {
        let temVizinho = false;
        for (const [dl, dc] of deltas) {
          const nl = l + dl;
          const nc = col + dc;
          if (nl >= 0 && nl < LINHAS_QTD && nc >= 0 && nc < COLUNAS_QTD) {
            if (grid[nl][nc] === 1) {
              temVizinho = true;
              break;
            }
          }
        }
        if (temVizinho) dezenasColadas++;

        if (!visitados[l][col]) {
          let tamanhoIlha = 0;
          const fila: [number, number][] = [[l, col]];
          visitados[l][col] = true;

          while (fila.length > 0) {
            const [curL, curC] = fila.shift()!;
            tamanhoIlha++;

            for (const [dl, dc] of deltas) {
              const nl = curL + dl;
              const nc = curC + dc;
              if (nl >= 0 && nl < LINHAS_QTD && nc >= 0 && nc < COLUNAS_QTD) {
                if (grid[nl][nc] === 1 && !visitados[nl][nc]) {
                  visitados[nl][nc] = true;
                  fila.push([nl, nc]);
                }
              }
            }
          }

          if (tamanhoIlha > maiorIlhaContigua) {
            maiorIlhaContigua = tamanhoIlha;
          }
        }
      }
    }
  }

  return {
    id: c.id || index + 1,
    numeroCartela: c.numeroCartela || index + 1,
    selecionadas: matriz,
    dezenas,
    totalDezenas: dezenas.length,
    linhasPontos,
    linhasVazias,
    linhasCom1,
    linhasCom2Plus,
    colunasPontos,
    dezenasColadas,
    maiorIlhaContigua
  };
}

// ==============================================================
// ADICIONE A PARTIR DAQUI (NO FINAL DO FICHEIRO):
// ==============================================================

/**
 * Motor combinatório heurístico para cobertura mínima de dezenas.
 * Produz o menor volume de bilhetes de 50 dezenas a partir do conjunto fornecido.
 */
export function sintetizarCartelasOtimizadas(
  dezenasBase: number[],
  alvoPontos: number = 15,
  limiteMaximoDezenas?: number
): { id: string; numeroCartela: number; dezenas: number[]; selecionadas: number[][] }[] {
  let pool = Array.from(new Set(dezenasBase)).sort((a, b) => a - b);

  if (limiteMaximoDezenas && limiteMaximoDezenas > 0 && pool.length > limiteMaximoDezenas) {
    pool = pool.slice(0, limiteMaximoDezenas);
  }

  if (pool.length < 50) {
    const restantes: number[] = [];
    for (let i = 1; i <= TOTAL_CASAS; i++) {
      if (!pool.includes(i)) restantes.push(i);
    }
    while (pool.length < 50 && restantes.length > 0) {
      pool.push(restantes.shift()!);
    }
    pool.sort((a, b) => a - b);
  }

  if (pool.length === 50) {
    return [montarObjetoCartela(1, pool)];
  }

  const sobreposicaoMinima = Math.min(48, Math.max(25, 50 - (20 - alvoPontos) * 5));
  const passo = Math.max(2, 50 - sobreposicaoMinima);

  const cartelasGeradas: number[][] = [];
  let offset = 0;

  while (offset + 50 <= pool.length) {
    const jogo = pool.slice(offset, offset + 50);
    cartelasGeradas.push(jogo);
    offset += passo;
    if (cartelasGeradas.length >= 25) break;
  }

  if (offset < pool.length && cartelasGeradas.length < 25) {
    const jogoFinal = pool.slice(pool.length - 50, pool.length);
    const repetida = cartelasGeradas.some(
      g => g.length === jogoFinal.length && g.every((v, i) => v === jogoFinal[i])
    );
    if (!repetida) {
      cartelasGeradas.push(jogoFinal);
    }
  }

  return cartelasGeradas.map((jogo, idx) => montarObjetoCartela(idx + 1, jogo));
}

function montarObjetoCartela(indice: number, dezenas: number[]) {
  const matriz = Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0));
  dezenas.forEach(num => {
    const idxReal = num - 1;
    const l = Math.floor(idxReal / COLUNAS_QTD);
    const c = idxReal % COLUNAS_QTD;
    if (l >= 0 && l < LINHAS_QTD && c >= 0 && c < COLUNAS_QTD) {
      matriz[l][c] = 1;
    }
  });

  return {
    id: `sintetizada-${Date.now()}-${indice}`,
    numeroCartela: indice,
    dezenas: dezenas.sort((a, b) => a - b),
    selecionadas: matriz
  };
}