'use client';

import { useState, useRef, useEffect } from 'react';

const TOTAL_NUMEROS = 100;
const ESTADO_VAZIO = 0;
const ESTADO_SELECIONADO = 1;
const ESTADO_FIXO = 2;

// Chaves de armazenamento local
const STORAGE_CARTELAS_KEY = 'estrategico_cartelas_ativas';
const STORAGE_REGUAS_KEY = 'estrategico_reguas_ativas';

const CORES_REGUA = [
  { bg: 'rgba(239, 68, 68, 0.35)', borda: '#b91c1c', texto: '#7f1d1d', puxador: '#991b1b' },
  { bg: 'rgba(234, 179, 8, 0.35)', borda: '#ca8a04', texto: '#713f12', puxador: '#a16207' },
  { bg: 'rgba(34, 197, 94, 0.35)', borda: '#16a34a', texto: '#14532d', puxador: '#15803d' },
  { bg: 'rgba(168, 85, 247, 0.35)', borda: '#9333ea', texto: '#581c87', puxador: '#7e22ce' },
  { bg: 'rgba(249, 115, 22, 0.35)', borda: '#ea580c', texto: '#7c2d12', puxador: '#c2410c' },
];

interface ReguaItem {
  id: number;
  x: number;
  y: number;
  largura: number;
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
  const [reguas, setReguas] = useState<ReguaItem[]>([]);

  // Carrega os dados gravados assim que a página abre
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

      const reguasSalvas = localStorage.getItem(STORAGE_REGUAS_KEY);
      if (reguasSalvas) {
        setReguas(JSON.parse(reguasSalvas));
      }
    } catch {
      setCartelas(
        Array.from({ length: QUANTIDADE_INICIAL }, () => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO))
      );
    } finally {
      setCarregado(true);
    }
  }, []);

  // Grava automaticamente no localStorage sempre que houver alterações nas cartelas
  useEffect(() => {
    if (carregado) {
      localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(cartelas));
    }
  }, [cartelas, carregado]);

  // Grava automaticamente as réguas
  useEffect(() => {
    if (carregado) {
      localStorage.setItem(STORAGE_REGUAS_KEY, JSON.stringify(reguas));
    }
  }, [reguas, carregado]);

  const arrastoRef = useRef<{
    id: number | null;
    tipo: 'mover' | 'redimensionar' | null;
    startX: number;
    startY: number;
    origemX: number;
    origemY: number;
    larguraInicial: number;
  }>({
    id: null,
    tipo: null,
    startX: 0,
    startY: 0,
    origemX: 0,
    origemY: 0,
    larguraInicial: 0,
  });

  useEffect(() => {
    const aoMoverRato = (e: MouseEvent) => {
      const { id, tipo, startX, startY, origemX, origemY, larguraInicial } = arrastoRef.current;
      if (!tipo || id === null) return;

      setReguas((anteriores) =>
        anteriores.map((regua) => {
          if (regua.id !== id) return regua;

          if (tipo === 'mover') {
            const novoX = origemX + (e.clientX - startX);
            const novoY = origemY + (e.clientY - startY);
            return { ...regua, x: Math.max(10, novoX), y: Math.max(10, novoY) };
          } else if (tipo === 'redimensionar') {
            const novaLargura = larguraInicial + (e.clientX - startX);
            return { ...regua, largura: Math.max(45, novaLargura) };
          }
          return regua;
        })
      );
    };

    const aoSoltarRato = () => {
      arrastoRef.current.tipo = null;
      arrastoRef.current.id = null;
    };

    window.addEventListener('mousemove', aoMoverRato);
    window.addEventListener('mouseup', aoSoltarRato);

    return () => {
      window.removeEventListener('mousemove', aoMoverRato);
      window.removeEventListener('mouseup', aoSoltarRato);
    };
  }, []);

  const iniciarArrasto = (e: React.MouseEvent, regua: ReguaItem) => {
    arrastoRef.current = {
      id: regua.id,
      tipo: 'mover',
      startX: e.clientX,
      startY: e.clientY,
      origemX: regua.x,
      origemY: regua.y,
      larguraInicial: regua.largura,
    };
  };

  const iniciarRedimensionamento = (e: React.MouseEvent, regua: ReguaItem) => {
    e.stopPropagation();
    arrastoRef.current = {
      id: regua.id,
      tipo: 'redimensionar',
      startX: e.clientX,
      startY: e.clientY,
      origemX: regua.x,
      origemY: regua.y,
      larguraInicial: regua.largura,
    };
  };

  const adicionarRegua = () => {
    const novaRegua: ReguaItem = {
      id: Date.now(),
      x: 140 + (reguas.length % 5) * 20,
      y: 80 + (reguas.length % 5) * 35,
      largura: 140,
      corIdx: reguas.length % CORES_REGUA.length,
    };
    setReguas((anteriores) => [...anteriores, novaRegua]);
  };

  const excluirRegua = (id: number) => {
    setReguas((anteriores) => anteriores.filter((regua) => regua.id !== id));
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
      {reguas.map((regua, index) => {
        const cor = CORES_REGUA[regua.corIdx];
        return (
          <div
            key={regua.id}
            onMouseDown={(e) => iniciarArrasto(e, regua)}
            style={{
              ...styles.regua,
              left: regua.x,
              top: regua.y,
              width: regua.largura,
              background: cor.bg,
              borderColor: cor.borda,
            }}
            title="Clique e arraste para movimentar esta régua"
          >
            <div style={styles.reguaLadoEsquerdo}>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => excluirRegua(regua.id)}
                style={styles.btnExcluirRegua}
                title="Excluir esta régua"
              >
                ×
              </button>
              <span style={{ ...styles.reguaTexto, color: cor.texto }}>R{index + 1}</span>
            </div>

            <div
              onMouseDown={(e) => iniciarRedimensionamento(e, regua)}
              style={{ ...styles.puxadorRedimensionar, background: cor.puxador }}
              title="Puxe aqui para alterar a largura"
            />
          </div>
        );
      })}

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
            style={{
              ...styles.btnAcao,
              background: '#fef08a',
              color: '#854d0e',
              border: '1px solid #eab308',
            }}
            onClick={adicionarRegua}
          >
            📏 + Nova Régua {reguas.length > 0 && `(${reguas.length})`}
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
    </main>
  );
}

const styles = {
  container: {
    background: '#f8fafc',
    minHeight: '100vh',
    padding: '12px 16px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  regua: {
    position: 'fixed' as const,
    height: 20,
    border: '2px dashed',
    borderRadius: 6,
    zIndex: 9999,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(1px)',
    userSelect: 'none' as const,
  },
  reguaLadoEsquerdo: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btnExcluirRegua: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '50%',
    width: 16,
    height: 16,
    fontSize: 11,
    lineHeight: 1,
    cursor: 'pointer',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontWeight: 900,
  },
  reguaTexto: {
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    pointerEvents: 'none' as const,
  },
  puxadorRedimensionar: {
    width: 12,
    height: 16,
    borderRadius: 3,
    cursor: 'ew-resize',
  },
  topo: {
    maxWidth: 1350,
    margin: '0 auto 12px auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 8,
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