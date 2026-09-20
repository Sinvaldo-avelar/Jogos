'use client';

import React, { useState, useRef, useEffect } from 'react';

const TOTAL_NUMEROS = 100;
const ESTADO_VAZIO = 0;
const ESTADO_SELECIONADO = 1;
const ESTADO_FIXO = 2;

const STORAGE_CARTELAS_KEY = 'estrategico_cartelas_ativas';
const STORAGE_FORMAS_KEY = 'estrategico_formas_ativas';

const CORES_FORMA = [
  { fill: 'rgba(239, 68, 68, 0.32)', stroke: '#b91c1c', ponto: '#dc2626' },
  { fill: 'rgba(234, 179, 8, 0.32)', stroke: '#ca8a04', ponto: '#eab308' },
  { fill: 'rgba(34, 197, 94, 0.32)', stroke: '#16a34a', ponto: '#22c55e' },
  { fill: 'rgba(168, 85, 247, 0.32)', stroke: '#9333ea', ponto: '#a855f7' },
  { fill: 'rgba(249, 115, 22, 0.32)', stroke: '#ea580c', ponto: '#f97316' },
  { fill: 'rgba(6, 182, 212, 0.32)', stroke: '#0891b2', ponto: '#06b6d4' },
];

interface Ponto {
  x: number;
  y: number;
}

interface FormaItem {
  id: number;
  pontos: Ponto[];
  corIdx: number;
}

function formatarNumero(indice: number) {
  return indice === 99 ? '00' : String(indice + 1).padStart(2, '0');
}

function LinhaNumeros({
  valores,
  aoAlternar,
}: {
  valores: number[];
  aoAlternar: (indice: number) => void;
}) {
  return (
    <div style={styles.linhaNumeros}>
      {valores.map((estado, indice) => {
        const selecionado = estado === ESTADO_SELECIONADO || estado === ESTADO_FIXO;
        const fixo = estado === ESTADO_FIXO;

        return (
          <button
            key={indice}
            type="button"
            onClick={() => aoAlternar(indice)}
            style={{
              ...styles.numero,
              background: fixo ? '#ef4444' : selecionado ? '#2563eb' : '#fff',
              borderColor: fixo ? '#b91c1c' : selecionado ? '#1d4ed8' : '#cbd5e1',
              color: selecionado ? '#fff' : '#1e293b',
            }}
          >
            {formatarNumero(indice)}
          </button>
        );
      })}
    </div>
  );
}

export default function Estrategico() {
  const QUANTIDADE_INICIAL = 10;

  const [carregado, setCarregado] = useState(false);
  const [cartelas, setCartelas] = useState<number[][]>([]);
  const [formas, setFormas] = useState<FormaItem[]>([]);
  const [formaEmFoco, setFormaEmFoco] = useState<number | null>(null);

  useEffect(() => {
    try {
      const cartelasSalvas = localStorage.getItem(STORAGE_CARTELAS_KEY);
      if (cartelasSalvas) {
        setCartelas(JSON.parse(cartelasSalvas));
      } else {
        setCartelas(
          Array.from({ length: QUANTIDADE_INICIAL }, () => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO))
        );
      }

      const formasSalvas = localStorage.getItem(STORAGE_FORMAS_KEY);
      if (formasSalvas) {
        setFormas(JSON.parse(formasSalvas));
      }
    } catch {
      setCartelas(
        Array.from({ length: QUANTIDADE_INICIAL }, () => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO))
      );
    } finally {
      setCarregado(true);
    }
  }, []);

  useEffect(() => {
    if (carregado) {
      localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(cartelas));
    }
  }, [cartelas, carregado]);

  useEffect(() => {
    if (carregado) {
      localStorage.setItem(STORAGE_FORMAS_KEY, JSON.stringify(formas));
    }
  }, [formas, carregado]);

  const arrastoRef = useRef<{
    idForma: number | null;
    tipo: 'ponto' | 'forma' | null;
    indicePonto: number | null;
    startX: number;
    startY: number;
    pontosIniciais: Ponto[];
  }>({
    idForma: null,
    tipo: null,
    indicePonto: null,
    startX: 0,
    startY: 0,
    pontosIniciais: [],
  });

  useEffect(() => {
    const aoMoverRato = (e: MouseEvent) => {
      const { idForma, tipo, indicePonto, startX, startY, pontosIniciais } = arrastoRef.current;
      if (!tipo || idForma === null) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setFormas((anteriores) =>
        anteriores.map((forma) => {
          if (forma.id !== idForma) return forma;

          if (tipo === 'ponto' && indicePonto !== null) {
            const novosPontos = [...forma.pontos];
            novosPontos[indicePonto] = {
              x: Math.max(5, pontosIniciais[indicePonto].x + deltaX),
              y: Math.max(5, pontosIniciais[indicePonto].y + deltaY),
            };
            return { ...forma, pontos: novosPontos };
          } else if (tipo === 'forma') {
            const novosPontos = pontosIniciais.map((p) => ({
              x: Math.max(5, p.x + deltaX),
              y: Math.max(5, p.y + deltaY),
            }));
            return { ...forma, pontos: novosPontos };
          }
          return forma;
        })
      );
    };

    const aoSoltarRato = () => {
      arrastoRef.current.tipo = null;
      arrastoRef.current.idForma = null;
      arrastoRef.current.indicePonto = null;
    };

    window.addEventListener('mousemove', aoMoverRato);
    window.addEventListener('mouseup', aoSoltarRato);

    return () => {
      window.removeEventListener('mousemove', aoMoverRato);
      window.removeEventListener('mouseup', aoSoltarRato);
    };
  }, []);

  const iniciarArrastoPonto = (e: React.MouseEvent, idForma: number, indicePonto: number, pontos: Ponto[]) => {
    e.stopPropagation();
    arrastoRef.current = {
      idForma,
      tipo: 'ponto',
      indicePonto,
      startX: e.clientX,
      startY: e.clientY,
      pontosIniciais: pontos.map((p) => ({ ...p })),
    };
  };

  const iniciarArrastoForma = (e: React.MouseEvent, idForma: number, pontos: Ponto[]) => {
    e.stopPropagation();
    arrastoRef.current = {
      idForma,
      tipo: 'forma',
      indicePonto: null,
      startX: e.clientX,
      startY: e.clientY,
      pontosIniciais: pontos.map((p) => ({ ...p })),
    };
  };

  const adicionarFormaTriangular = () => {
    const topoY = 120 + (formas.length % 4) * 40;
    const centroX = 260 + (formas.length % 4) * 30;
    const nova: FormaItem = {
      id: Date.now(),
      pontos: [
        { x: centroX, y: topoY },
        { x: centroX + 130, y: topoY + 60 },
        { x: centroX - 50, y: topoY + 70 },
      ],
      corIdx: formas.length % CORES_FORMA.length,
    };
    setFormas((anteriores) => [...anteriores, nova]);
  };

  const adicionarFormaLivre = () => {
    const topoY = 140 + (formas.length % 4) * 40;
    const centroX = 300 + (formas.length % 4) * 30;
    const nova: FormaItem = {
      id: Date.now(),
      pontos: [
        { x: centroX, y: topoY },
        { x: centroX + 120, y: topoY + 25 },
        { x: centroX + 55, y: topoY + 95 },
      ],
      corIdx: formas.length % CORES_FORMA.length,
    };
    setFormas((anteriores) => [...anteriores, nova]);
  };

  const adicionarFormaRetangulo = () => {
    const topoY = 100 + (formas.length % 4) * 40;
    const centroX = 220 + (formas.length % 4) * 30;
    const nova: FormaItem = {
      id: Date.now(),
      pontos: [
        { x: centroX, y: topoY },
        { x: centroX + 160, y: topoY },
        { x: centroX + 160, y: topoY + 50 },
        { x: centroX, y: topoY + 50 },
      ],
      corIdx: formas.length % CORES_FORMA.length,
    };
    setFormas((anteriores) => [...anteriores, nova]);
  };

  const adicionarPontoNaForma = (idForma: number) => {
    setFormas((anteriores) =>
      anteriores.map((forma) => {
        if (forma.id !== idForma) return forma;
        const ultimoPonto = forma.pontos[forma.pontos.length - 1];
        return {
          ...forma,
          pontos: [...forma.pontos, { x: ultimoPonto.x + 30, y: ultimoPonto.y + 30 }],
        };
      })
    );
  };

  const excluirForma = (idForma: number) => {
    setFormas((anteriores) => anteriores.filter((f) => f.id !== idForma));
  };

  const alternarNumeroCartela = (cartelaIdx: number, numIdx: number) => {
    setCartelas((anteriores) =>
      anteriores.map((cartela, cIdx) => {
        if (cIdx !== cartelaIdx) return cartela;
        const nova = [...cartela];
        nova[numIdx] = (nova[numIdx] + 1) % 3;
        return nova;
      })
    );
  };

  const limparCartelaIndividual = (cartelaIdx: number) => {
    setCartelas((anteriores) =>
      anteriores.map((cartela, cIdx) =>
        cIdx === cartelaIdx ? Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO) : cartela
      )
    );
  };

  const adicionarCartela = () => {
    setCartelas((anteriores) => [...anteriores, Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO)]);
  };

  const limparTodas = () => {
    if (confirm('Deseja desmarcar todos os números de todas as cartelas?')) {
      const reset = cartelas.map(() => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO));
      setCartelas(reset);
      localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(reset));
    }
  };

  if (!carregado) return null;

  return (
    <main style={styles.container}>
      {/* Camada SVG Flutuante das Réguas */}
      <svg style={styles.svgOverlay}>
        {formas.map((forma, idx) => {
          const cor = CORES_FORMA[forma.corIdx];
          const pontosSvg = forma.pontos.map((p) => `${p.x},${p.y}`).join(' ');
          const menorX = Math.min(...forma.pontos.map((ponto) => ponto.x));
          const menorY = Math.min(...forma.pontos.map((ponto) => ponto.y));

          return (
            <g
              key={forma.id}
              onMouseEnter={() => setFormaEmFoco(forma.id)}
              onMouseLeave={() => setFormaEmFoco(null)}
            >
              <polygon
                points={pontosSvg}
                fill={cor.fill}
                stroke={cor.stroke}
                strokeWidth="2"
                strokeDasharray="4 2"
                style={{ cursor: 'move', pointerEvents: 'auto' }}
                onMouseDown={(e) => iniciarArrastoForma(e, forma.id, forma.pontos)}
              />

              <foreignObject
                x={menorX}
                y={Math.max(8, menorY - 34)}
                width="75"
                height="28"
                style={{
                  overflow: 'visible',
                  opacity: formaEmFoco === forma.id ? 1 : 0,
                  pointerEvents: formaEmFoco === forma.id ? 'auto' : 'none',
                  transition: 'opacity 120ms ease',
                }}
              >
                <div style={styles.menuForma}>
                  <span style={{ ...styles.tagForma, color: cor.stroke }}>#{idx + 1}</span>
                  <button
                    type="button"
                    title="Adicionar mais uma ponta"
                    onClick={() => adicionarPontoNaForma(forma.id)}
                    style={styles.btnAcaoMini}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    title="Excluir esta régua"
                    onClick={() => excluirForma(forma.id)}
                    style={{ ...styles.btnAcaoMini, color: '#dc2626' }}
                  >
                    ×
                  </button>
                </div>
              </foreignObject>

              {forma.pontos.map((ponto, pIdx) => (
                <circle
                  key={pIdx}
                  cx={ponto.x}
                  cy={ponto.y}
                  r="10"
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="0"
                  style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
                  onMouseDown={(e) => iniciarArrastoPonto(e, forma.id, pIdx, forma.pontos)}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Cabeçalho fixado no topo para nunca sumir ao rolar */}
      <header style={styles.topo}>
        <button
          type="button"
          style={styles.btnVoltar}
          onClick={() => {
            window.location.href = '/';
          }}
        >
          ← Voltar
        </button>
        <span style={styles.contadorGeral}>Total de Cartelas: {cartelas.length}</span>
        <div style={styles.topoAcoes}>
          <button
            type="button"
            style={{ ...styles.btnAcao, background: '#fef08a', color: '#854d0e', border: '1px solid #eab308' }}
            onClick={adicionarFormaTriangular}
          >
            📐 + Régua Triangular
          </button>
          <button
            type="button"
            style={{ ...styles.btnAcao, background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}
            onClick={adicionarFormaRetangulo}
          >
            ⬛ + Régua 4 Pontas
          </button>
          <button
            type="button"
            style={{ ...styles.btnAcao, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}
            onClick={adicionarFormaLivre}
          >
            ✦ + Régua Livre
          </button>
          <button type="button" style={styles.btnAcao} onClick={adicionarCartela}>
            + Adicionar Cartela
          </button>
          <button
            type="button"
            style={{ ...styles.btnAcao, background: '#fee2e2', color: '#b91c1c' }}
            onClick={limparTodas}
          >
            Limpar Todas
          </button>
        </div>
      </header>

      {/* Área deslizante das cartelas */}
      <div style={styles.areaDeslizante}>
        <div style={styles.listaCartelas}>
          {cartelas.map((cartela, idx) => {
            const totalMarcados = cartela.filter((estado) => estado > 0).length;

            return (
              <div key={idx} style={styles.cartelaBox}>
                <div style={styles.infoCartela}>
                  <span style={styles.badgeNumero}>#{String(idx + 1).padStart(2, '0')}</span>
                  <span
                    style={{
                      ...styles.badgeContador,
                      background: totalMarcados > 0 ? '#dbeafe' : '#f1f5f9',
                      color: totalMarcados > 0 ? '#1d4ed8' : '#64748b',
                      borderColor: totalMarcados > 0 ? '#93c5fd' : '#e2e8f0',
                    }}
                    title="Total de números marcados nesta cartela"
                  >
                    {totalMarcados}
                  </span>
                  {totalMarcados > 0 && (
                    <button
                      type="button"
                      style={styles.btnLimparCartela}
                      title="Limpar apenas esta cartela"
                      onClick={() => limparCartelaIndividual(idx)}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div style={styles.gradeContainer}>
                  <LinhaNumeros
                    valores={cartela}
                    aoAlternar={(numIdx) => alternarNumeroCartela(idx, numIdx)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    background: '#f8fafc',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  svgOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none' as const,
    zIndex: 9990,
  },
  menuForma: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    background: '#ffffff',
    padding: '2px 4px',
    borderRadius: 6,
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    border: '1px solid #cbd5e1',
    pointerEvents: 'auto' as const,
  },
  tagForma: {
    fontSize: 10,
    fontWeight: 900,
  },
  btnAcaoMini: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 4,
    width: 15,
    height: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
    padding: 0,
    color: '#334155',
  },
  topo: {
    width: '100%',
    maxWidth: 1350,
    margin: '12px auto 8px auto',
    padding: '0 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 8,
    flexShrink: 0,
    zIndex: 10,
  },
  btnVoltar: {
    background: '#e2e8f0',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    color: '#334155',
  },
  contadorGeral: {
    fontWeight: 800,
    fontSize: 14,
    color: '#475569',
  },
  topoAcoes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  btnAcao: {
    background: '#dbeafe',
    color: '#1d4ed8',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  areaDeslizante: {
    flex: 1,
    overflowY: 'scroll' as const, // Permite sempre a barra de rolagem vertical deslizar
    overflowX: 'hidden' as const,
    padding: '8px 16px 100vh 16px', // 70vh de espaço inferior permite rolar as cartelas para qualquer posição
  },
  listaCartelas: {
    maxWidth: 1350,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  cartelaBox: {
    background: '#ffffff',
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  infoCartela: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 78,
    flexShrink: 0,
  },
  badgeNumero: {
    fontSize: 12,
    fontWeight: 900,
    color: '#475569',
  },
  badgeContador: {
    fontSize: 11,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    minWidth: 24,
    textAlign: 'center' as const,
  },
  btnLimparCartela: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: 14,
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
    fontWeight: 700,
  },
  gradeContainer: {
    flex: 1,
    overflowX: 'auto' as const,
  },
  linhaNumeros: {
    display: 'grid',
    gridTemplateColumns: 'repeat(50, minmax(18px, 1fr))',
    gridTemplateRows: 'repeat(2, auto)',
    gap: 2,
    width: '100%',
  },
  numero: {
    width: '100%',
    minWidth: 0,
    height: 24,
    padding: 0,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none' as const,
  },
};