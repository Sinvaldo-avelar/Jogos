'use client';

import React, { useEffect, useState, useMemo } from 'react';

const COLUNAS_QTD = 5;
const LINHAS_QTD = 20;

interface CartelaDados {
  id: number | string;
  numeroCartela: number;
  selecionadas: number[][];
  dezenas: number[];
  faixasVazias: number[];
  faixasCom1: number[];
}

export default function TelemetriaDireta() {
  const [cartelas, setCartelas] = useState<CartelaDados[]>([]);
  const [faixasEscolhidas, setFaixasEscolhidas] = useState<number[]>([]);
  const [modoFiltro, setModoFiltro] = useState<'todasVazias' | 'vaziasOuUm'>('vaziasOuUm');

  const carregarDados = () => {
    const raw = localStorage.getItem('gerador_cartelas_fixas_5x20') || '[]';
    try {
      const data = JSON.parse(raw);
      const lista: CartelaDados[] = data.map((c: any, idx: number) => {
        const dezenas: number[] = [];
        const faixasVazias: number[] = [];
        const faixasCom1: number[] = [];

        if (Array.isArray(c.selecionadas)) {
          c.selecionadas.forEach((linha: number[], lIdx: number) => {
            const marcadasLinha = linha.filter(v => v === 1 || v === 2).length;
            if (marcadasLinha === 0) faixasVazias.push(lIdx);
            if (marcadasLinha === 1) faixasCom1.push(lIdx);

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
          faixasVazias,
          faixasCom1,
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

  // Filtra as cartelas de acordo com a seleção exata de faixas
  const resultadoFiltro = useMemo(() => {
    if (faixasEscolhidas.length === 0) {
      return { exatas: cartelas, tolerantes: [] };
    }

    const exatas = cartelas.filter(c =>
      faixasEscolhidas.every(f => c.faixasVazias.includes(f))
    );

    const tolerantes = cartelas.filter(c => {
      if (exatas.some(e => e.id === c.id)) return false;
      return faixasEscolhidas.every(f => c.faixasVazias.includes(f) || c.faixasCom1.includes(f));
    });

    return { exatas, tolerantes };
  }, [cartelas, faixasEscolhidas]);

  const listaExibicao = modoFiltro === 'todasVazias' 
    ? resultadoFiltro.exatas 
    : [...resultadoFiltro.exatas, ...resultadoFiltro.tolerantes];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 20, fontFamily: 'sans-serif' }}>
      
      {/* BARRA SUPERIOR OBJETIVA */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, margin: 0, fontWeight: 900, color: '#0f172a' }}>
              🎯 AUDITOR DE FAIXAS & CARTELAS VIVAS
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
              Bancada total: <b>{cartelas.length} cartelas</b>
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

        {/* SELETOR DAS 20 FAIXAS (DIRETO E NUMÉRICO) */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            CLIQUE NAS FAIXAS QUE VOCÊ QUER VER VAZIAS (OU COM 1 NÚMERO):
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
      </div>

      {/* PLACAR DIRETO DA CONSULTA */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
          {faixasEscolhidas.length === 0 ? (
            <span>Selecione uma ou mais faixas acima para filtrar suas cartelas.</span>
          ) : (
            <span>
              Faixas consultadas: <b>{faixasEscolhidas.map(f => `F${f + 1}`).join(', ')}</b>
            </span>
          )}
        </div>

        {faixasEscolhidas.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModoFiltro('todasVazias')}
              style={{
                background: modoFiltro === 'todasVazias' ? '#dbeafe' : '#f8fafc',
                border: modoFiltro === 'todasVazias' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Vácuo Puro (0 números)</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#1d4ed8' }}>
                {resultadoFiltro.exatas.length} cartelas encontradas
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModoFiltro('vaziasOuUm')}
              style={{
                background: modoFiltro === 'vaziasOuUm' ? '#fef3c7' : '#f8fafc',
                border: modoFiltro === 'vaziasOuUm' ? '2px solid #d97706' : '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Com Tolerância (0 ou até 1 número)</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#b45309' }}>
                {resultadoFiltro.exatas.length + resultadoFiltro.tolerantes.length} cartelas encontradas
              </div>
            </button>
          </div>
        )}
      </div>

      {/* LISTAGEM DAS CARTELAS REAIS ENCONTRADAS */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>
          CARTELAS CORRESPONDENTES ({listaExibicao.length}):
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          {listaExibicao.map((c) => {
            const ehV0Puro = faixasEscolhidas.length > 0 && faixasEscolhidas.every(f => c.faixasVazias.includes(f));

            return (
              <div
                key={c.id}
                style={{
                  background: '#fff',
                  border: ehV0Puro ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, fontWeight: 900 }}>
                  <span style={{ color: ehV0Puro ? '#1d4ed8' : '#334155' }}>Cartela #{c.numeroCartela}</span>
                  <span style={{ color: '#64748b' }}>{c.dezenas.length} dezenas</span>
                </div>

                {/* Grade 5x20 real da cartela */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {c.selecionadas.map((linha, lIdx) => {
                    const estaNaConsulta = faixasEscolhidas.includes(lIdx);
                    return (
                      <div key={lIdx} style={{ display: 'flex', gap: 2 }}>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}