'use client';

import React, { useState, useRef, useEffect } from 'react';

const TOTAL_NUMEROS = 100;
const ESTADO_VAZIO = 0;
const ESTADO_SELECIONADO = 1;
const ESTADO_FIXO = 2;

const STORAGE_CARTELAS_KEY = 'estrategico_cartelas_ativas';
const STORAGE_GABARITOS_KEY = 'estrategico_gabaritos_transparentes';

const CORES_GABARITO = [
  { solido: '#dc2626', borda: '#991b1b', nome: 'Vermelho' },
  { solido: '#16a34a', borda: '#15803d', nome: 'Verde' },
  { solido: '#9333ea', borda: '#7e22ce', nome: 'Roxo' },
  { solido: '#ea580c', borda: '#c2410c', nome: 'Laranja' },
];

interface GabaritoItem {
  id: number;
  x: number;
  y: number;
  valores: number[];
  corIdx: number;
}

// Estados possíveis para a seleção por clique
type SelecaoTroca =
  | { modo: 'CARTELA'; cartelaIdx: number }
  | { modo: 'METADE'; cartelaIdx: number; metade: 'cima' | 'baixo' }
  | null;

function formatarNumero(indice: number) {
  return indice === 99 ? '00' : String(indice + 1).padStart(2, '0');
}

// Linha de 50 dezenas com botão de seleção para troca
function BlocoMetadeNumeros({
  valores,
  inicioOffset,
  tipo,
  selecionadoParaTroca,
  aoClicarMetade,
  aoAlternar,
}: {
  valores: number[];
  inicioOffset: number;
  tipo: 'cima' | 'baixo';
  selecionadoParaTroca: boolean;
  aoClicarMetade: () => void;
  aoAlternar: (indiceReal: number) => void;
}) {
  return (
    <div
      style={{
        ...styles.blocoMetade,
        outline: selecionadoParaTroca ? '2px solid #2563eb' : 'none',
        background: selecionadoParaTroca ? '#eff6ff' : 'transparent',
      }}
    >
      {/* Botão de Clique para Selecionar e Trocar a Metade */}
      <button
        type="button"
        onClick={aoClicarMetade}
        style={{
          ...styles.btnMetade,
          background: selecionadoParaTroca ? '#2563eb' : '#f1f5f9',
          color: selecionadoParaTroca ? '#ffffff' : '#475569',
          borderColor: selecionadoParaTroca ? '#1d4ed8' : '#cbd5e1',
        }}
        title="Clique para selecionar e depois clique na metade de outra cartela para trocar"
      >
        <span style={{ fontSize: 9, fontWeight: 800 }}>
          {tipo === 'cima' ? '▲ 01-50' : '▼ 51-00'}
        </span>
      </button>

      <div style={styles.grid50}>
        {valores.map((estado, idxRelativo) => {
          const indiceReal = inicioOffset + idxRelativo;
          const selecionado = estado === ESTADO_SELECIONADO || estado === ESTADO_FIXO;
          const fixo = estado === ESTADO_FIXO;

          return (
            <button
              key={indiceReal}
              type="button"
              onClick={() => aoAlternar(indiceReal)}
              style={{
                ...styles.numero,
                background: fixo ? '#ef4444' : selecionado ? '#2563eb' : '#fff',
                borderColor: fixo ? '#b91c1c' : selecionado ? '#1d4ed8' : '#cbd5e1',
                color: selecionado ? '#fff' : '#1e293b',
              }}
            >
              {formatarNumero(indiceReal)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Estrategico() {
  const QUANTIDADE_INICIAL = 10;

  const [carregado, setCarregado] = useState(false);
  const [cartelas, setCartelas] = useState<number[][]>([]);
  const [gabaritos, setGabaritos] = useState<GabaritoItem[]>([]);
  
  // Controle da seleção ativa para troca por clique
  const [selecaoTroca, setSelecaoTroca] = useState<SelecaoTroca>(null);

  // Carregar dados locais
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

      const gabaritosSalvos = localStorage.getItem(STORAGE_GABARITOS_KEY);
      if (gabaritosSalvos) {
        setGabaritos(JSON.parse(gabaritosSalvos));
      }
    } catch {
      setCartelas(
        Array.from({ length: QUANTIDADE_INICIAL }, () => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO))
      );
    } finally {
      setCarregado(true);
    }
  }, []);

  // Persistência
  useEffect(() => {
    if (carregado) {
      localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(cartelas));
    }
  }, [cartelas, carregado]);

  useEffect(() => {
    if (carregado) {
      localStorage.setItem(STORAGE_GABARITOS_KEY, JSON.stringify(gabaritos));
    }
  }, [gabaritos, carregado]);

  // Cancelar seleção com tecla ESC
  useEffect(() => {
    const tratarKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelecaoTroca(null);
      }
    };
    window.addEventListener('keydown', tratarKeyDown);
    return () => window.removeEventListener('keydown', tratarKeyDown);
  }, []);

  // Gestão de arrasto da cartela-gabarito flutuante
  const arrastoRef = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    origemX: number;
    origemY: number;
  }>({
    id: null,
    startX: 0,
    startY: 0,
    origemX: 0,
    origemY: 0,
  });

  useEffect(() => {
    const aoMoverRato = (e: MouseEvent) => {
      const { id, startX, startY, origemX, origemY } = arrastoRef.current;
      if (id === null) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setGabaritos((anteriores) =>
        anteriores.map((gab) => {
          if (gab.id !== id) return gab;
          return {
            ...gab,
            x: Math.max(10, origemX + deltaX),
            y: Math.max(10, origemY + deltaY),
          };
        })
      );
    };

    const aoSoltarRato = () => {
      arrastoRef.current.id = null;
    };

    window.addEventListener('mousemove', aoMoverRato);
    window.addEventListener('mouseup', aoSoltarRato);

    return () => {
      window.removeEventListener('mousemove', aoMoverRato);
      window.removeEventListener('mouseup', aoSoltarRato);
    };
  }, []);

  const iniciarArrastoGabarito = (e: React.MouseEvent, gab: GabaritoItem) => {
    arrastoRef.current = {
      id: gab.id,
      startX: e.clientX,
      startY: e.clientY,
      origemX: gab.x,
      origemY: gab.y,
    };
  };

  const adicionarGabarito = () => {
    const novo: GabaritoItem = {
      id: Date.now(),
      x: 120 + (gabaritos.length % 4) * 25,
      y: 90 + (gabaritos.length % 4) * 45,
      valores: Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO),
      corIdx: gabaritos.length % CORES_GABARITO.length,
    };
    setGabaritos((anteriores) => [...anteriores, novo]);
  };

  const alternarNumeroGabarito = (idGabarito: number, indiceNum: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) => {
        if (gab.id !== idGabarito) return gab;
        const novosValores = [...gab.valores];
        novosValores[indiceNum] = novosValores[indiceNum] === 0 ? 1 : 0;
        return { ...gab, valores: novosValores };
      })
    );
  };

  const limparGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) =>
        gab.id === idGabarito ? { ...gab, valores: Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO) } : gab
      )
    );
  };

  const excluirGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) => anteriores.filter((gab) => gab.id !== idGabarito));
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

  // --- LÓGICA DE TROCA POR CLIQUE ---

  // 1. Trocar cartela inteira
  const selecionarOuTrocarCartelaInteira = (idx: number) => {
    if (!selecaoTroca) {
      setSelecaoTroca({ modo: 'CARTELA', cartelaIdx: idx });
      return;
    }

    if (selecaoTroca.modo === 'CARTELA') {
      if (selecaoTroca.cartelaIdx === idx) {
        setSelecaoTroca(null); // Cancelar se clicar na mesma
        return;
      }

      // Executa a troca direta entre as duas posições
      setCartelas((anteriores) => {
        const nova = [...anteriores];
        const temp = nova[selecaoTroca.cartelaIdx];
        nova[selecaoTroca.cartelaIdx] = nova[idx];
        nova[idx] = temp;
        return nova;
      });
      setSelecaoTroca(null);
    } else {
      // Se estava com metade selecionada, troca para o modo cartela
      setSelecaoTroca({ modo: 'CARTELA', cartelaIdx: idx });
    }
  };

  // 2. Trocar metade de 50 dezenas (01-50 ou 51-00)
  const selecionarOuTrocarMetade = (cartelaIdx: number, metade: 'cima' | 'baixo') => {
    if (!selecaoTroca) {
      setSelecaoTroca({ modo: 'METADE', cartelaIdx, metade });
      return;
    }

    if (selecaoTroca.modo === 'METADE') {
      if (selecaoTroca.cartelaIdx === cartelaIdx && selecaoTroca.metade === metade) {
        setSelecaoTroca(null); // Cancelar se clicar na mesma
        return;
      }

      // Executa a troca apenas das metades selecionadas
      setCartelas((anteriores) => {
        const nova = anteriores.map((c) => [...c]);

        const inicioOrigem = selecaoTroca.metade === 'cima' ? 0 : 50;
        const inicioDestino = metade === 'cima' ? 0 : 50;

        const dadosOrigem = nova[selecaoTroca.cartelaIdx].slice(inicioOrigem, inicioOrigem + 50);
        const dadosDestino = nova[cartelaIdx].slice(inicioDestino, inicioDestino + 50);

        for (let i = 0; i < 50; i++) {
          nova[cartelaIdx][inicioDestino + i] = dadosOrigem[i];
          nova[selecaoTroca.cartelaIdx][inicioOrigem + i] = dadosDestino[i];
        }

        return nova;
      });
      setSelecaoTroca(null);
    } else {
      // Se estava com cartela inteira, troca para metade
      setSelecaoTroca({ modo: 'METADE', cartelaIdx, metade });
    }
  };

  if (!carregado) return null;

  return (
    <main style={styles.container}>
      {/* Camada das Cartelas Gabarito Transparentes Flutuantes */}
      {gabaritos.map((gab, idx) => {
        const cor = CORES_GABARITO[gab.corIdx];
        const marcadosNoGabarito = gab.valores.filter((v) => v > 0).length;

        return (
          <div
            key={gab.id}
            style={{
              ...styles.gabaritoContainer,
              left: gab.x,
              top: gab.y,
              border: `2px dashed ${cor.borda}`,
            }}
          >
            <div
              onMouseDown={(e) => iniciarArrastoGabarito(e, gab)}
              style={styles.alcaGabarito}
              title="Clique e arraste para movimentar este gabarito"
            >
              <span style={{ fontSize: 10, fontWeight: 900, color: cor.borda }}>G{idx + 1}</span>
              <span style={styles.badgeContadorGabarito}>{marcadosNoGabarito}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {marcadosNoGabarito > 0 && (
                  <button
                    type="button"
                    onClick={() => limparGabarito(gab.id)}
                    style={styles.btnAcaoMini}
                    title="Limpar números deste gabarito"
                  >
                    ↺
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => excluirGabarito(gab.id)}
                  style={{ ...styles.btnAcaoMini, color: '#dc2626' }}
                  title="Fechar gabarito"
                >
                  ×
                </button>
              </div>
            </div>

            <div style={styles.gradeContainer}>
              <div style={styles.gradeNumerosTotal}>
                {gab.valores.map((ativo, numIdx) => (
                  <button
                    key={numIdx}
                    type="button"
                    onClick={() => alternarNumeroGabarito(gab.id, numIdx)}
                    style={{
                      ...styles.numero,
                      background: ativo ? cor.solido : 'transparent',
                      borderColor: ativo ? cor.borda : 'transparent',
                      color: ativo ? '#ffffff' : 'transparent',
                      boxShadow: ativo ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                    }}
                  >
                    {ativo ? formatarNumero(numIdx) : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <header style={styles.topo}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        </div>

        {/* Alerta flutuante de modo de troca ativo */}
        {selecaoTroca && (
          <div style={styles.barraTrocaAtiva}>
            <span>
              {selecaoTroca.modo === 'CARTELA' ? (
                <>Cartela <b>#{String(selecaoTroca.cartelaIdx + 1).padStart(2, '0')}</b> selecionada. Clique em outra cartela para trocar de lugar!</>
              ) : (
                <>
                  Metade <b>{selecaoTroca.metade === 'cima' ? '▲ 01-50' : '▼ 51-00'}</b> da Cartela <b>#{String(selecaoTroca.cartelaIdx + 1).padStart(2, '0')}</b> selecionada. Clique em outra metade para trocar!
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => setSelecaoTroca(null)}
              style={styles.btnCancelarTroca}
            >
              Cancelar (ESC)
            </button>
          </div>
        )}

        <div style={styles.topoAcoes}>
          <button
            type="button"
            style={{
              ...styles.btnAcao,
              background: '#fef08a',
              color: '#854d0e',
              border: '1px solid #eab308',
            }}
            onClick={adicionarGabarito}
          >
            📋 + Cartela Gabarito {gabaritos.length > 0 && `(${gabaritos.length})`}
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

      <div style={styles.areaDeslizante}>
        <div style={styles.listaCartelas}>
          {cartelas.map((cartela, idx) => {
            const totalMarcados = cartela.filter((estado) => estado > 0).length;
            const isCartelaSelecionada =
              selecaoTroca?.modo === 'CARTELA' && selecaoTroca.cartelaIdx === idx;

            return (
              <div
                key={idx}
                style={{
                  ...styles.cartelaBox,
                  border: isCartelaSelecionada ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  boxShadow: isCartelaSelecionada ? '0 0 10px rgba(245, 158, 11, 0.3)' : styles.cartelaBox.boxShadow,
                }}
              >
                {/* Bloco Lateral com botão de selecionar Cartela Inteira */}
                <div style={styles.infoCartela}>
                  <button
                    type="button"
                    onClick={() => selecionarOuTrocarCartelaInteira(idx)}
                    style={{
                      ...styles.btnCartelaInteira,
                      background: isCartelaSelecionada ? '#f59e0b' : '#f8fafc',
                      color: isCartelaSelecionada ? '#ffffff' : '#334155',
                      borderColor: isCartelaSelecionada ? '#d97706' : '#cbd5e1',
                    }}
                    title="Clique para selecionar e depois clique em outra cartela para trocar de lugar"
                  >
                    #{String(idx + 1).padStart(2, '0')} ⇄
                  </button>

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

                {/* Grade dividida em duas metades (01-50 e 51-00) com clique interativo */}
                <div style={styles.gradeContainer}>
                  <BlocoMetadeNumeros
                    tipo="cima"
                    inicioOffset={0}
                    valores={cartela.slice(0, 50)}
                    selecionadoParaTroca={
                      selecaoTroca?.modo === 'METADE' &&
                      selecaoTroca.cartelaIdx === idx &&
                      selecaoTroca.metade === 'cima'
                    }
                    aoClicarMetade={() => selecionarOuTrocarMetade(idx, 'cima')}
                    aoAlternar={(numIdx) => alternarNumeroCartela(idx, numIdx)}
                  />

                  <BlocoMetadeNumeros
                    tipo="baixo"
                    inicioOffset={50}
                    valores={cartela.slice(50, 100)}
                    selecionadoParaTroca={
                      selecaoTroca?.modo === 'METADE' &&
                      selecaoTroca.cartelaIdx === idx &&
                      selecaoTroca.metade === 'baixo'
                    }
                    aoClicarMetade={() => selecionarOuTrocarMetade(idx, 'baixo')}
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
  topo: {
    width: '100%',
    maxWidth: 1380,
    margin: '4px auto 2px auto',
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
  barraTrocaAtiva: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    color: '#92400e',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    animation: 'pulse 2s infinite',
  },
  btnCancelarTroca: {
    background: '#ffffff',
    border: '1px solid #d97706',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 800,
    padding: '2px 6px',
    cursor: 'pointer',
    color: '#b45309',
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
    overflowY: 'scroll' as const,
    overflowX: 'hidden' as const,
    padding: '4px 16px 100vh 16px',
  },
  listaCartelas: {
    maxWidth: 1380,
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
    gap: 8,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    transition: 'border 0.2s, box-shadow 0.2s',
  },
  infoCartela: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 95,
    flexShrink: 0,
  },
  btnCartelaInteira: {
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 900,
    padding: '3px 6px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    transition: 'all 0.15s ease',
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
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
    overflowX: 'auto' as const,
  },
  blocoMetade: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 4px',
    borderRadius: 6,
    transition: 'background 0.2s, outline 0.2s',
  },
  btnMetade: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    padding: '2px 4px',
    minWidth: 54,
    textAlign: 'center' as const,
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  grid50: {
    display: 'grid',
    gridTemplateColumns: 'repeat(50, minmax(17px, 1fr))',
    gap: 2,
    width: '100%',
  },
  gradeNumerosTotal: {
    display: 'grid',
    gridTemplateColumns: 'repeat(50, minmax(17px, 1fr))',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none' as const,
    cursor: 'pointer',
  },
  // Estilos da Cartela Gabarito Transparente Flutuante
  gabaritoContainer: {
    position: 'fixed' as const,
    zIndex: 9999,
    width: 'calc(100% - 32px)',
    maxWidth: 1380,
    background: 'transparent',
    borderRadius: 8,
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
    pointerEvents: 'none' as const,
  },
  alcaGabarito: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 95,
    cursor: 'grab',
    background: '#ffffff',
    padding: '3px 6px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    userSelect: 'none' as const,
    pointerEvents: 'auto' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  badgeContadorGabarito: {
    fontSize: 11,
    fontWeight: 900,
    background: '#f1f5f9',
    padding: '1px 5px',
    borderRadius: 8,
    color: '#334155',
  },
  btnAcaoMini: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
    padding: 0,
    color: '#475569',
  },
};