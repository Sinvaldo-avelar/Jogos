'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  COLUNAS_QTD, 
  LINHAS_QTD, 
  RadiografiaCartela, 
  analisarCartela 
} from './radiografiaMotor';

interface CartaoFlutuante {
  id: string;
  nome: string; // Ex: G1, G2
  corBorda: string; // Ex: #dc2626 (vermelho), #16a34a (verde)
  x: number;
  y: number;
  dezenas: number[];
}

export default function TelemetriaMesaLuz() {
  const [cartelas, setCartelas] = useState<RadiografiaCartela[]>([]);

  // Dezenas clicadas no Cartão Raio-X base
  const [dezenasRaioX, setDezenasRaioX] = useState<number[]>([]);
  const [criterioBusca, setCriterioBusca] = useState<'peloMenosUm' | 'todas'>('peloMenosUm');
  const [cartelasFixadasIds, setCartelasFixadasIds] = useState<(string | number)[]>([]);

  // Lista de Cartões Flutuantes Transparentes (G1, G2, etc.)
  const [cartoesFlutuantes, setCartoesFlutuantes] = useState<CartaoFlutuante[]>([]);

  // Controle de arrasto (drag & drop livre)
  const dragItem = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const carregarDados = () => {
    const raw = localStorage.getItem('gerador_cartelas_fixas_5x20') || '[]';
    try {
      const data = JSON.parse(raw);
      const analisadas = data.map((c: any, idx: number) => analisarCartela(c, idx));
      setCartelas(analisadas);
    } catch (e) {
      console.error('Erro ao ler bancada:', e);
    }
  };

  useEffect(() => {
    carregarDados();
    window.addEventListener('storage', carregarDados);
    return () => window.removeEventListener('storage', carregarDados);
  }, []);

  // Listeners de mouse globais para arrasto suave
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragItem.current) return;
      const { id, offsetX, offsetY } = dragItem.current;
      setCartoesFlutuantes(prev =>
        prev.map(c => (c.id === id ? { ...c, x: e.clientX - offsetX, y: e.clientY - offsetY } : c))
      );
    };

    const onMouseUp = () => {
      dragItem.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const iniciarArrasto = (e: React.MouseEvent, id: string) => {
    const cartao = cartoesFlutuantes.find(c => c.id === id);
    if (!cartao) return;
    dragItem.current = {
      id,
      offsetX: e.clientX - cartao.x,
      offsetY: e.clientY - cartao.y
    };
  };

  // Cria um novo cartão translúcido flutuante na tela
  const adicionarCartaoFlutuante = () => {
    const cores = ['#b91c1c', '#15803d', '#1d4ed8', '#7c3aed', '#c2410c'];
    const idx = cartoesFlutuantes.length;
    const novoNome = `G${idx + 1}`;
    const novaCor = cores[idx % cores.length];

    const novoCartao: CartaoFlutuante = {
      id: `cartao-${Date.now()}`,
      nome: novoNome,
      corBorda: novaCor,
      x: 340 + (idx % 4) * 60,
      y: 120 + (idx % 4) * 40,
      // Se tiver dezenas marcadas no Raio-X, inicializa com elas, senão vazio
      dezenas: [...dezenasRaioX]
    };

    setCartoesFlutuantes(prev => [...prev, novoCartao]);
  };

  const fecharCartaoFlutuante = (id: string) => {
    setCartoesFlutuantes(prev => prev.filter(c => c.id !== id));
  };

  const alternarDezenaNoCartao = (cartaoId: string, num: number) => {
    setCartoesFlutuantes(prev =>
      prev.map(c => {
        if (c.id !== cartaoId) return c;
        const jaTem = c.dezenas.includes(num);
        const dezenas = jaTem ? c.dezenas.filter(n => n !== num) : [...c.dezenas, num];
        return { ...c, dezenas };
      })
    );
  };

  const alternarDezenaRaioX = (num: number) => {
    setDezenasRaioX(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  const alternarFixarCartela = (id: string | number) => {
    setCartelasFixadasIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filtragem das cartelas que aparecem na tela branca
  const cartelasMesa = useMemo(() => {
    if (dezenasRaioX.length === 0) {
      return cartelas.filter(c => cartelasFixadasIds.includes(c.id));
    }
    return cartelas.filter(c => {
      if (cartelasFixadasIds.includes(c.id)) return true;
      if (criterioBusca === 'peloMenosUm') {
        return dezenasRaioX.some(d => c.dezenas.includes(d));
      }
      return dezenasRaioX.every(d => c.dezenas.includes(d));
    });
  }, [cartelas, dezenasRaioX, criterioBusca, cartelasFixadasIds]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 14, fontFamily: 'sans-serif', position: 'relative', overflowX: 'hidden' }}>
      
      {/* CABEÇALHO SUPERIOR */}
      <header style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 16, margin: 0, fontWeight: 900, color: '#0f172a' }}>
            💡 MESA DE LUZ & PELÍCULAS FLUTUANTES (RAIO-X)
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
            Bancada: <b>{cartelas.length} cartelas</b> | Visíveis: <b>{cartelasMesa.length}</b> | Películas ativas: <b>{cartoesFlutuantes.length}</b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={adicionarCartaoFlutuante}
            style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ➕ Novo Gabarito Translúcido (G{cartoesFlutuantes.length + 1})
          </button>

          {cartelasFixadasIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCartelasFixadasIds([])}
              style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Soltar Pins ({cartelasFixadasIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={carregarDados}
            style={{ background: '#0f172a', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            🔄 Sincronizar
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 14, alignItems: 'start' }}>
        
        {/* CARTÃO RAIO-X FIXO À ESQUERDA (SELETOR BASE) */}
        <aside style={{ background: '#fff', border: '2px solid #0284c7', borderRadius: 8, padding: 10, position: 'sticky', top: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#0284c7' }}>🩻 RAIO-X MESTRE</span>
            {dezenasRaioX.length > 0 && (
              <button
                type="button"
                onClick={() => setDezenasRaioX([])}
                style={{ background: '#fee2e2', border: 'none', color: '#b91c1c', fontSize: 9, padding: '2px 5px', borderRadius: 3, cursor: 'pointer', fontWeight: 800 }}
              >
                Limpar ({dezenasRaioX.length})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setCriterioBusca('peloMenosUm')}
              style={{ flex: 1, background: criterioBusca === 'peloMenosUm' ? '#0284c7' : '#f1f5f9', color: criterioBusca === 'peloMenosUm' ? '#fff' : '#475569', border: 'none', borderRadius: 4, padding: '4px 0', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}
            >
              Pelo menos 1
            </button>
            <button
              type="button"
              onClick={() => setCriterioBusca('todas')}
              style={{ flex: 1, background: criterioBusca === 'todas' ? '#0284c7' : '#f1f5f9', color: criterioBusca === 'todas' ? '#fff' : '#475569', border: 'none', borderRadius: 4, padding: '4px 0', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}
            >
              Todas juntas
            </button>
          </div>

          {/* GRADE 20x5 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: LINHAS_QTD }, (_, lIdx) => (
              <div key={lIdx} style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {Array.from({ length: COLUNAS_QTD }, (_, cIdx) => {
                  const num = lIdx * COLUNAS_QTD + cIdx + 1;
                  const ativo = dezenasRaioX.includes(num);
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => alternarDezenaRaioX(num)}
                      style={{
                        width: 30,
                        height: 22,
                        fontSize: 10,
                        fontWeight: 900,
                        borderRadius: 3,
                        cursor: 'pointer',
                        background: ativo ? '#0284c7' : '#fff',
                        color: ativo ? '#fff' : '#334155',
                        border: ativo ? '2px solid #0369a1' : '1px solid #cbd5e1',
                        padding: 0
                      }}
                    >
                      {(num === 100 ? 0 : num).toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* TELA BRANCA COM AS CARTELAS DA BANCADA */}
        <main style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, minHeight: '85vh', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>
              Cartelas da Bancada na Mesa ({cartelasMesa.length})
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Dica: Arraste os cartões flutuantes para cima das cartelas para conferir sobreposições e fendas.
            </span>
          </div>

          {cartelasMesa.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🩻</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Nenhuma cartela na mesa de luz.</div>
              <p style={{ fontSize: 11, margin: '4px 0 0' }}>
                Clique em números no Raio-X à esquerda para trazer as cartelas da bancada para a mesa.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
              {cartelasMesa.map(c => {
                const estaFixada = cartelasFixadasIds.includes(c.id);
                const matches = dezenasRaioX.filter(n => c.dezenas.includes(n));

                return (
                  <div
                    key={c.id}
                    style={{
                      background: '#fff',
                      border: estaFixada ? '2px solid #f59e0b' : matches.length > 0 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#0284c7' }}>#{c.numeroCartela}</span>
                      <button
                        type="button"
                        onClick={() => alternarFixarCartela(c.id)}
                        style={{
                          background: estaFixada ? '#f59e0b' : '#f1f5f9',
                          color: estaFixada ? '#fff' : '#475569',
                          border: 'none',
                          borderRadius: 3,
                          padding: '1px 5px',
                          fontSize: 9,
                          cursor: 'pointer',
                          fontWeight: 800
                        }}
                      >
                        {estaFixada ? '📌 Fixa' : 'Pin'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {c.selecionadas.map((linha, lIdx) => (
                        <div key={lIdx} style={{ display: 'flex', gap: 1 }}>
                          {linha.map((val, colIdx) => {
                            const num = lIdx * COLUNAS_QTD + colIdx + 1;
                            const marcado = val === 1 || val === 2;
                            const bateu = dezenasRaioX.includes(num);

                            return (
                              <div
                                key={colIdx}
                                style={{
                                  width: 18,
                                  height: 18,
                                  fontSize: 8,
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 2,
                                  background: marcado ? (bateu ? '#dc2626' : '#2563eb') : '#f8fafc',
                                  color: marcado ? '#fff' : '#cbd5e1'
                                }}
                              >
                                {(num === 100 ? 0 : num).toString().padStart(2, '0')}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* PELÍCULAS RAIO-X TRANSLÚCIDAS MÓVEIS (G1, G2, G3...)      */}
      {/* ========================================================= */}
      {cartoesFlutuantes.map(cf => (
        <div
          key={cf.id}
          style={{
            position: 'fixed',
            left: cf.x,
            top: cf.y,
            width: 154,
            background: 'rgba(255, 255, 255, 0.72)', // Translúcido estilo folha de acetato
            backdropFilter: 'blur(3px)',
            border: `2px dashed ${cf.corBorda}`, // Borda tracejada colorida identica à sua imagem
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none'
          }}
        >
          {/* BARRA SUPERIOR PARA ARRASTAR */}
          <div
            onMouseDown={e => iniciarArrasto(e, cf.id)}
            style={{
              padding: '4px 6px',
              cursor: 'grab',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px dashed ${cf.corBorda}`,
              background: 'rgba(255, 255, 255, 0.85)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: cf.corBorda }}>{cf.nome}</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
                {cf.dezenas.length}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCartoesFlutuantes(prev => prev.map(c => c.id === cf.id ? { ...c, dezenas: [] } : c))}
                title="Limpar dezenas deste gabarito"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 10, padding: 0 }}
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() => fecharCartaoFlutuante(cf.id)}
                title="Fechar gabarito"
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 900, cursor: 'pointer', fontSize: 11, padding: 0 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* GRADE 20x5 DA PELÍCULA TRANSLÚCIDA */}
          <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Array.from({ length: LINHAS_QTD }, (_, lIdx) => (
              <div key={lIdx} style={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: COLUNAS_QTD }, (_, cIdx) => {
                  const num = lIdx * COLUNAS_QTD + cIdx + 1;
                  const ativo = cf.dezenas.includes(num);

                  return (
                    <div
                      key={cIdx}
                      onClick={() => alternarDezenaNoCartao(cf.id, num)}
                      style={{
                        width: 26,
                        height: 18,
                        fontSize: 9,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 3,
                        cursor: 'pointer',
                        // Se estiver ativo, ganha a cor de destaque translúcida
                        background: ativo ? cf.corBorda : 'rgba(255, 255, 255, 0.25)',
                        color: ativo ? '#ffffff' : 'rgba(100, 116, 139, 0.4)',
                        border: ativo ? `1px solid ${cf.corBorda}` : '1px solid rgba(226, 232, 240, 0.5)'
                      }}
                    >
                      {(num === 100 ? 0 : num).toString().padStart(2, '0')}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}