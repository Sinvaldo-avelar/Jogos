'use client';

import { useState } from 'react';

const TOTAL_NUMEROS = 100;
const ESTADO_VAZIO = 0;
const ESTADO_SELECIONADO = 1;
const ESTADO_FIXO = 2;

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
  const [cartelas, setCartelas] = useState<number[][]>(() =>
    Array.from({ length: QUANTIDADE_INICIAL }, () => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO))
  );

  const alternarNumeroCartela = (cartelaIdx: number, numIdx: number) => {
    setCartelas((anteriores) =>
      anteriores.map((cartela, cIdx) => {
        if (cIdx !== cartelaIdx) return cartela;
        const nova = [...cartela];
        nova[numIdx] = (nova[numIdx] + 1) % 3; // 0 -> 1 (azul) -> 2 (vermelho) -> 0
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
      setCartelas((anteriores) => anteriores.map(() => Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO)));
    }
  };

  return (
    <main style={styles.container}>
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
          // Conta quantos números foram marcados nesta cartela específica
          const totalMarcados = cartela.filter((estado) => estado > 0).length;

          return (
            <div key={idx} style={styles.cartelaBox}>
              {/* Painel lateral compacto com o número da cartela e o contador */}
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