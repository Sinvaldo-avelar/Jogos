// src/lib/gerador.js

export const blocos = {
  A1: [1, 3, 4, 8, 9],
  A2: [11, 12, 13, 15, 17],
  A3: [19, 21, 23, 24, 25],
  B1: [2, 5, 6, 7, 10],
  B2: [14, 16, 18, 20, 22]
};

export function gerar100Jogos() {
  let jogos = [];

  // 1. 40 Jogos Focados na Sobra (B1 + B2 fixos + 5 da Base)
  for (let i = 0; i < 40; i++) {
    const sobraFixa = [...blocos.B1, ...blocos.B2];
    const poolBase = [...blocos.A1, ...blocos.A2, ...blocos.A3];
    const complemento = poolBase.sort(() => Math.random() - 0.5).slice(0, 5);
    jogos.push([...sobraFixa, ...complemento].sort((a, b) => a - b));
  }

  // 2. 40 Jogos Focados na sua Base (A1+A2+A3 com substituições leves)
  for (let i = 0; i < 40; i++) {
    let baseOriginal = [...blocos.A1, ...blocos.A2, ...blocos.A3];
    const poolSobra = [...blocos.B1, ...blocos.B2];
    baseOriginal.sort(() => Math.random() - 0.5).splice(0, 3); // Tira 3
    const substitutos = poolSobra.sort(() => Math.random() - 0.5).slice(0, 3); // Coloca 3
    jogos.push([...baseOriginal, ...substitutos].sort((a, b) => a - b));
  }

  // 3. 20 Jogos de Colisão de Blocos (A1 + A2 + B1, etc.)
  const combos = [
    [...blocos.A1, ...blocos.A2, ...blocos.B1],
    [...blocos.A2, ...blocos.A3, ...blocos.B2],
    [...blocos.A1, ...blocos.A3, ...blocos.B1],
    [...blocos.A1, ...blocos.B1, ...blocos.B2],
    [...blocos.A2, ...blocos.B1, ...blocos.B2]
  ];
  for (let i = 0; i < 20; i++) {
    jogos.push([...combos[i % combos.length]].sort((a, b) => a - b));
  }

  return jogos;
}