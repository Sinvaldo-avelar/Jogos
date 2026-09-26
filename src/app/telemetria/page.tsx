'use client';

import React, { useEffect, useState, useMemo } from 'react';

const COLUNAS_QTD = 5;
const LINHAS_QTD = 20;

interface CartelaDados {
  id: number | string;
  numeroCartela: number;
  selecionadas: number[][];
  dezenas: number[];
  contagemPorFaixa: number[]; // Guarda exatamente quantos números tem em cada uma das 20 faixas (0 a 5)
}

export default function TelemetriaDireta() {
  const [cartelas, setCartelas] = useState<CartelaDados[]>([]);
  const [faixasEscolhidas, setFaixasEscolhidas] = useState<number[]>([]);
  // Filtro de densidade: '0', '1', '2', '3', '4', '5' ou '0_ou_1' (vácuo flexível)
  const [densidadeFiltro, setDensidadeFiltro] = useState<string>('0_ou_1');

  const carregarDados = () => {
    const raw = localStorage.getItem('gerador_cartelas_fixas_5x20') || '[]';
    try {
      const data = JSON.parse(raw);
      const lista: CartelaDados[] = data.map((c: any, idx: number) => {
        const dezenas: number[] = [];
        const contagemPorFaixa = Array(LINHAS_QTD).fill(0);

        if (Array.isArray(c.selecionadas)) {
          c.selecionadas.forEach((linha: number[], lIdx: number) => {
            const marcadasLinha = linha.filter(v => v === 1 || v === 2).length;
            contagemPorFaixa[lIdx] = marcadasLinha;

            linha.forEach((v, cIdx) => {
              if (v === 1 || v === 2) {
                dezenas.push(lIdx * COLUNAS_QTD + cIdx + 1);
              }
            });
          });
        }

        return {
          id: c.id || idx + 1,
          numeroCartela: c.numeroCartela || idx + 1,
          selecionadas: c.selecionadas || [],
          dezenas,
          contagemPorFaixa,
        };
      });

      setCartelas(lista);
    } catch (e) {
      console.error('Erro ao ler bancada:', e);
    }
  };

  useEffect(() => {
    carregarDados();
    window.addEventListener('storage', carregarDados);
    return () => window.removeEventListener('storage', carregarDados);
  }, []);

  const alternarFaixa = (fIdx: number) => {
    setFaixasEscolhidas(prev =>
      prev.includes(fIdx) ? prev.filter(f => f !== fIdx) : [...prev, fIdx].sort((a, b) => a - b)
    );
  };

  // Filtra as cartelas de acordo com a densidade exata escolhida
  const cartelasFiltradas = useMemo(() => {
    if (faixasEscolhidas.length === 0) return cartelas;

    return cartelas.filter(c => {
      return faixasEscolhidas.every(fIdx => {
        const qtdNaFaixa = c.contagemPorFaixa[fIdx];

        if (densidadeFiltro === '0_ou_1') {
          return qtdNaFaixa === 0 || qtdNaFaixa === 1;
        }

        return qtdNaFaixa === Number(densidadeFiltro);
      });
    });
  }, [cartelas, faixasEscolhidas, densidadeFiltro]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 20, fontFamily: 'sans-serif' }}>
      
      {/* BARRA DE CONTROLE */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, margin: 0, fontWeight: 900, color: '#0f172a' }}>
              🎯 AUDITOR DE FAIXAS & DENSIDADE DE PONTOS
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
              Bancada ativa: <b>{cartelas.length} cartelas fixas</b>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {faixasEscolhidas.length > 0 && (
              <button
                type="button"
                onClick={() => setFaixasEscolhidas([])}
                style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '6px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
              >
                Limpar Faixas ✕
              </button>
            )}
            <button
              type="button"
              onClick={carregarDados}
              style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
            >
              🔄 Atualizar Bancada
            </button>
          </div>
        </div>

        {/* 20 FAIXAS CLICÁVEIS */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            1. SELECIONE AS FAIXAS QUE VOCÊ QUER INSPECIONAR:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
            {Array.from({ length: LINHAS_QTD }, (_, i) => {
              const inicio = i * COLUNAS_QTD + 1;
              const fim = (i + 1) * COLUNAS_QTD;
              const ativa = faixasEscolhidas.includes(i);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => alternarFaixa(i)}
                  style={{
                    background: ativa ? '#0284c7' : '#fff',
                    border: ativa ? '2px solid #0369a1' : '1px solid #cbd5e1',
                    color: ativa ? '#fff' : '#0f172a',
                    borderRadius: 6,
                    padding: '6px 2px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 900 }}>F{i + 1}</span>
                  <span style={{ fontSize: 9, opacity: 0.9 }}>
                    {(inicio === 100 ? 0 : inicio).toString().padStart(2, '0')}-{(fim === 100 ? 0 : fim).toString().padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SELETOR DE DENSIDADE (QUANTOS PONTOS POR FAIXA) */}
        <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            2. O QUE VOCÊ QUER QUE ESSAS FAIXAS TENHAM NAS CARTELAS?
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: '0_ou_1', rotulo: '🛡️ Vácuo ou 1 pt (Tolerância)' },
              { id: '0', rotulo: '🕳️ Só 0 pts (Vácuo Puro)' },
              { id: '1', rotulo: '1️⃣ Só 1 pt' },
              { id: '2', rotulo: '2️⃣ Só 2 pts' },
              { id: '3', rotulo: '3️⃣ Só 3 pts' },
              { id: '4', rotulo: '4️⃣ Só 4 pts' },
              { id: '5', rotulo: '🔥 5 pts (Cheias)' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDensidadeFiltro(item.id)}
                style={{
                  background: densidadeFiltro === item.id ? '#0f172a' : '#f1f5f9',
                  color: densidadeFiltro === item.id ? '#ffffff' : '#334155',
                  border: densidadeFiltro === item.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PLACAR DE RESULTADOS */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 13, color: '#64748b' }}>Consulta ativa: </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              {faixasEscolhidas.length > 0 
                ? `Faixas [ ${faixasEscolhidas.map(f => `F${f + 1}`).join(', ')} ]` 
                : 'Todas as cartelas (nenhuma faixa filtrada)'}
            </span>
          </div>

          <div style={{ fontSize: 15, fontWeight: 900, color: cartelasFiltradas.length > 0 ? '#16a34a' : '#dc2626' }}>
            {cartelasFiltradas.length} cartelas encontradas
          </div>
        </div>
      </div>

      {/* CARTELAS REAIS ENCONTRADAS */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          {cartelasFiltradas.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, fontWeight: 900 }}>
                <span style={{ color: '#0284c7' }}>Cartela #{c.numeroCartela}</span>
                <span style={{ color: '#64748b' }}>{c.dezenas.length} dezenas</span>
              </div>

              {/* Matriz 5x20 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {c.selecionadas.map((linha, lIdx) => {
                  const estaNaConsulta = faixasEscolhidas.includes(lIdx);
                  const qtdMarcadas = c.contagemPorFaixa[lIdx];

                  return (
                    <div key={lIdx} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      {linha.map((val, colIdx) => {
                        const num = lIdx * COLUNAS_QTD + colIdx + 1;
                        const marcado = val === 1 || val === 2;

                        return (
                          <div
                            key={colIdx}
                            style={{
                              width: 20,
                              height: 20,
                              fontSize: 9,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 3,
                              background: marcado ? '#2563eb' : estaNaConsulta ? '#fee2e2' : '#f1f5f9',
                              color: marcado ? '#fff' : estaNaConsulta ? '#b91c1c' : '#94a3b8',
                              border: estaNaConsulta ? '1px solid #fca5a5' : '1px solid #e2e8f0'
                            }}
                          >
                            {(num === 100 ? 0 : num).toString().padStart(2, '0')}
                          </div>
                        );
                      })}
                      {/* Indicador discreto da quantidade de pontos da faixa se estiver sob consulta */}
                      {estaNaConsulta && (
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#b91c1c', marginLeft: 2 }}>
                          {qtdMarcadas}p
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}