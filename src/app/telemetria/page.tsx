'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  COLUNAS_QTD, 
  LINHAS_QTD, 
  RadiografiaCartela, 
  analisarCartela 
} from './radiografiaMotor';

export default function TelemetriaBidimensional() {
  const [cartelas, setCartelas] = useState<RadiografiaCartela[]>([]);
  
  // Filtros Horizontais (Faixas)
  const [faixasEscolhidas, setFaixasEscolhidas] = useState<number[]>([]);
  const [densidadeFaixas, setDensidadeFaixas] = useState<string>('0_ou_1');

  // Filtros Verticais (5 Colunas)
  const [colunasEscolhidas, setColunasEscolhidas] = useState<number[]>([]);
  const [filtroColunaMin, setFiltroColunaMin] = useState<number>(0);

  // Filtro de Agrupamento / Concentração
  const [minAglomerado, setMinAglomerado] = useState<number>(0);

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

  const alternarFaixa = (fIdx: number) => {
    setFaixasEscolhidas(prev =>
      prev.includes(fIdx) ? prev.filter(f => f !== fIdx) : [...prev, fIdx].sort((a, b) => a - b)
    );
  };

  const alternarColuna = (cIdx: number) => {
    setColunasEscolhidas(prev =>
      prev.includes(cIdx) ? prev.filter(c => c !== cIdx) : [...prev, cIdx].sort((a, b) => a - b)
    );
  };

  // Motor de Filtro Multidimensional Instantâneo
  const cartelasFiltradas = useMemo(() => {
    return cartelas.filter(c => {
      // 1. Checagem das Linhas Horizontais
      if (faixasEscolhidas.length > 0) {
        const bateuFaixas = faixasEscolhidas.every(fIdx => {
          const qtd = c.linhasPontos[fIdx];
          if (densidadeFaixas === '0_ou_1') return qtd === 0 || qtd === 1;
          return qtd === Number(densidadeFaixas);
        });
        if (!bateuFaixas) return false;
      }

      // 2. Checagem das Colunas Verticais
      if (colunasEscolhidas.length > 0 && filtroColunaMin > 0) {
        const bateuColunas = colunasEscolhidas.every(cIdx => {
          return c.colunasPontos[cIdx] >= filtroColunaMin;
        });
        if (!bateuColunas) return false;
      }

      // 3. Checagem de Agrupamento / Ilha Mínima
      if (minAglomerado > 0 && c.maiorIlhaContigua < minAglomerado) {
        return false;
      }

      return true;
    });
  }, [cartelas, faixasEscolhidas, densidadeFaixas, colunasEscolhidas, filtroColunaMin, minAglomerado]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 20, fontFamily: 'sans-serif' }}>
      
      {/* PAINEL SUPERIOR: MESA DE CONTROLE BIDIMENSIONAL */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, margin: 0, fontWeight: 900, color: '#0f172a' }}>
              🔬 RADIOGRAFIA BIDIMENSIONAL (HORIZONTAL + VERTICAL)
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
              Bancada fixa: <b>{cartelas.length} cartelas</b> | Geometria de corte e canais ativada
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {(faixasEscolhidas.length > 0 || colunasEscolhidas.length > 0 || minAglomerado > 0) && (
              <button
                type="button"
                onClick={() => {
                  setFaixasEscolhidas([]);
                  setColunasEscolhidas([]);
                  setFiltroColunaMin(0);
                  setMinAglomerado(0);
                }}
                style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '6px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
              >
                Limpar Todos os Filtros ✕
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

        {/* 1. SELETOR HORIZONTAL (20 FAIXAS) */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            1. EIXO HORIZONTAL — SELECIONE AS 20 FAIXAS (LINHAS):
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

          {/* Critério da Linha */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              { id: '0_ou_1', label: '🛡️ Vácuo ou 1 pt' },
              { id: '0', label: '🕳️ Só 0 pts' },
              { id: '1', label: '1️⃣ Só 1 pt' },
              { id: '2', label: '2️⃣ Só 2 pts' },
              { id: '3', label: '3️⃣ Só 3 pts' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDensidadeFaixas(item.id)}
                style={{
                  background: densidadeFaixas === item.id ? '#0f172a' : '#f1f5f9',
                  color: densidadeFaixas === item.id ? '#fff' : '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 5,
                  padding: '4px 8px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. SELETOR VERTICAL (5 COLUNAS) E ILHAS */}
        <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          
          {/* Colunas */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
              2. EIXO VERTICAL — CANALETAS DE PESO (5 COLUNAS):
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: COLUNAS_QTD }, (_, cIdx) => {
                const ativa = colunasEscolhidas.includes(cIdx);
                return (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => alternarColuna(cIdx)}
                    style={{
                      flex: 1,
                      background: ativa ? '#16a34a' : '#fff',
                      border: ativa ? '2px solid #15803d' : '1px solid #cbd5e1',
                      color: ativa ? '#fff' : '#0f172a',
                      borderRadius: 6,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      fontWeight: 900,
                      fontSize: 12,
                      textAlign: 'center'
                    }}
                  >
                    Col {cIdx + 1}
                  </button>
                );
              })}
            </div>
            {colunasEscolhidas.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#475569', fontWeight: 700 }}>Exigir no mínimo:</span>
                {[8, 10, 12, 14].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFiltroColunaMin(prev => prev === val ? 0 : val)}
                    style={{
                      background: filtroColunaMin === val ? '#16a34a' : '#f1f5f9',
                      color: filtroColunaMin === val ? '#fff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {val}+ pts
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agrupamento Geométrico */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
              3. TOPOLOGIA — ILHAS / CONGLOMERADOS (DEZENAS COLADAS):
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { min: 0, label: 'Qualquer formato' },
                { min: 10, label: 'Ilha média (10+ coladas)' },
                { min: 15, label: 'Ilha maciça (15+ coladas)' },
                { min: 20, label: 'Super-bloco (20+ coladas)' }
              ].map(item => (
                <button
                  key={item.min}
                  type="button"
                  onClick={() => setMinAglomerado(item.min)}
                  style={{
                    background: minAglomerado === item.min ? '#7c3aed' : '#f1f5f9',
                    color: minAglomerado === item.min ? '#fff' : '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: 5,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PLACAR DE STATUS */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>
          Resultado da Busca: <span style={{ color: cartelasFiltradas.length > 0 ? '#16a34a' : '#dc2626' }}>{cartelasFiltradas.length} cartelas encontradas</span>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          Filtros ativos: {faixasEscolhidas.length} faixas H | {colunasEscolhidas.length} canais V | {minAglomerado > 0 ? `Ilha min ${minAglomerado}` : 'Sem filtro de ilha'}
        </div>
      </div>

      {/* GRADE DAS CARTELAS ENCONTRADAS COM RAIO-X COMPLETO */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        {cartelasFiltradas.map(c => (
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
            {/* Cabeçalho da Cartela */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, fontWeight: 900 }}>
              <span style={{ color: '#0284c7' }}>Cartela #{c.numeroCartela}</span>
              <span style={{ color: '#7c3aed' }}>Maior Ilha: {c.maiorIlhaContigua} pts</span>
            </div>

            {/* Placar das 5 Colunas */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 0', marginBottom: 6, fontSize: 9, fontWeight: 800, color: '#475569' }}>
              {c.colunasPontos.map((pts, cIdx) => (
                <span key={cIdx} style={{ color: colunasEscolhidas.includes(cIdx) ? '#16a34a' : '#475569' }}>
                  C{cIdx + 1}:{pts}
                </span>
              ))}
            </div>

            {/* Matriz 20x5 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {c.selecionadas.map((linha, lIdx) => {
                const estaNaConsultaFaixa = faixasEscolhidas.includes(lIdx);
                const qtdLinha = c.linhasPontos[lIdx];

                return (
                  <div key={lIdx} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {linha.map((val, colIdx) => {
                      const num = lIdx * COLUNAS_QTD + colIdx + 1;
                      const marcado = val === 1 || val === 2;
                      const colAtiva = colunasEscolhidas.includes(colIdx);

                      let bg = '#f1f5f9';
                      let color = '#94a3b8';

                      if (marcado) {
                        bg = colAtiva ? '#16a34a' : '#2563eb';
                        color = '#fff';
                      } else if (estaNaConsultaFaixa) {
                        bg = '#fee2e2';
                        color = '#b91c1c';
                      }

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
                            background: bg,
                            color: color,
                            border: estaNaConsultaFaixa ? '1px solid #fca5a5' : '1px solid #e2e8f0'
                          }}
                        >
                          {(num === 100 ? 0 : num).toString().padStart(2, '0')}
                        </div>
                      );
                    })}

                    {/* Indicador de peso da linha */}
                    {estaNaConsultaFaixa && (
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#b91c1c', marginLeft: 2 }}>
                        {qtdLinha}p
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
  );
}