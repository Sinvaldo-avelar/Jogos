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
        // Verifica se tem ao menos 1 vizinho ativo
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

        // Mede tamanho do aglomerado via BFS se ainda não visitado
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