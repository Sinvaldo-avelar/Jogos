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

  // --- MODO DA MESA ---
  // 'raioX' = Mesa de Luz interativa dezena por dezena
  // 'faixas' = Modo de corte de faixas/colunas anteriores
  const [modoVisao, setModoVisao] = useState<'raioX' | 'faixas'>('raioX');

  // --- ESTADO DO CARTÃO RAIO-X (DEZENAS CLICADAS) ---
  const [dezenasRaioX, setDezenasRaioX] = useState<number[]>([]);
  // Modo de busca: 'peloMenosUm' (se tiver qualquer dezena clicada) ou 'todas' (interseção rigorosa)
  const [criterioBusca, setCriterioBusca] = useState<'peloMenosUm' | 'todas'>('peloMenosUm');

  // --- CARTELAS FIXADAS MANUALMENTE NA TELA BRANCA ---
  const [cartelasFixadasIds, setCartelasFixadasIds] = useState<(string | number)[]>([]);

  // --- FILTROS DO MODO FAIXAS/COLUNAS ---
  const [faixasEscolhidas, setFaixasEscolhidas] = useState<number[]>([]);
  const [densidadeFaixas, setDensidadeFaixas] = useState<string>('0_ou_1');
  const [colunasEscolhidas, setColunasEscolhidas] = useState<number[]>([]);
  const [filtroColunaMin, setFiltroColunaMin] = useState<number>(0);
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

  // Alterna número no Cartão Raio-X
  const alternarDezenaRaioX = (num: number) => {
    setDezenasRaioX(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  // Alterna fixação da cartela na mesa
  const alternarFixarCartela = (id: string | number) => {
    setCartelasFixadasIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // --- FILTRAGEM DINÂMICA DA MESA DE LUZ ---
  const cartelasMesa = useMemo(() => {
    if (modoVisao === 'raioX') {
      // Se não clicou em nada no raio-x, mostra apenas as que foram fixadas com alfinete
      if (dezenasRaioX.length === 0) {
        return cartelas.filter(c => cartelasFixadasIds.includes(c.id));
      }

      return cartelas.filter(c => {
        // Se já está fixada, sempre fica na mesa
        if (cartelasFixadasIds.includes(c.id)) return true;

        if (criterioBusca === 'peloMenosUm') {
          // Basta ter 1 número clicado
          return dezenasRaioX.some(d => c.dezenas.includes(d));
        } else {
          // Tem que ter todas as dezenas clicadas
          return dezenasRaioX.every(d => c.dezenas.includes(d));
        }
      });
    }

    // Modo Faixas/Colunas
    return cartelas.filter(c => {
      if (cartelasFixadasIds.includes(c.id)) return true;

      if (faixasEscolhidas.length > 0) {
        const bateuFaixas = faixasEscolhidas.every(fIdx => {
          const qtd = c.linhasPontos[fIdx];
          if (densidadeFaixas === '0_ou_1') return qtd === 0 || qtd === 1;
          return qtd === Number(densidadeFaixas);
        });
        if (!bateuFaixas) return false;
      }

      if (colunasEscolhidas.length > 0 && filtroColunaMin > 0) {
        const bateuColunas = colunasEscolhidas.every(cIdx => c.colunasPontos[cIdx] >= filtroColunaMin);
        if (!bateuColunas) return false;
      }

      if (minAglomerado > 0 && c.maiorIlhaContigua < minAglomerado) {
        return false;
      }

      return true;
    });
  }, [
    cartelas, 
    modoVisao, 
    dezenasRaioX, 
    criterioBusca, 
    cartelasFixadasIds, 
    faixasEscolhidas, 
    densidadeFaixas, 
    colunasEscolhidas, 
    filtroColunaMin, 
    minAglomerado
  ]);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#0f172a', padding: 20, fontFamily: 'sans-serif' }}>
      
      {/* CABEÇALHO DE COMANDOS */}
      <header style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, margin: 0, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            💡 MESA DE LUZ & RAIO-X INTERATIVO
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            Bancada total: <b>{cartelas.length} cartelas</b> | Fixadas permanentemente: <b>{cartelasFixadasIds.length}</b>
          </p>
        </div>

        {/* SELETOR DE MODOS E ATUALIZAÇÃO */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: '#f1f5f9', padding: 3, borderRadius: 6, display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => setModoVisao('raioX')}
              style={{
                background: modoVisao === 'raioX' ? '#0284c7' : 'transparent',
                color: modoVisao === 'raioX' ? '#fff' : '#475569',
                border: 'none',
                borderRadius: 5,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🖐️ Cartão Raio-X
            </button>
            <button
              type="button"
              onClick={() => setModoVisao('faixas')}
              style={{
                background: modoVisao === 'faixas' ? '#0284c7' : 'transparent',
                color: modoVisao === 'faixas' ? '#fff' : '#475569',
                border: 'none',
                borderRadius: 5,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📏 Faixas & Colunas
            </button>
          </div>

          {cartelasFixadasIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCartelasFixadasIds([])}
              style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Soltar Todas ({cartelasFixadasIds.length} 📌)
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

      {/* ÁREA DE TRABALHO: SPLIT CARTÃO RAIO-X + TELA BRANCA */}
      <div style={{ display: 'grid', gridTemplateColumns: modoVisao === 'raioX' ? '240px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        
        {/* CARTÃO RAIO-X OPERÁVEL (COLUNA LATERAL FLUTUANTE/FIXA) */}
        {modoVisao === 'raioX' && (
          <aside style={{ background: '#fff', border: '2px solid #0284c7', borderRadius: 10, padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0284c7' }}>
                🩻 CARTÃO RAIO-X
              </span>
              {dezenasRaioX.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDezenasRaioX([])}
                  style={{ background: '#fee2e2', border: 'none', color: '#b91c1c', fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}
                >
                  Limpar ({dezenasRaioX.length})
                </button>
              )}
            </div>

            <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 10px 0' }}>
              Clique nas dezenas para iluminar as cartelas correspondentes na tela branca:
            </p>

            {/* CRITÉRIO DE ACERTO */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setCriterioBusca('peloMenosUm')}
                style={{
                  flex: 1,
                  background: criterioBusca === 'peloMenosUm' ? '#0284c7' : '#f1f5f9',
                  color: criterioBusca === 'peloMenosUm' ? '#fff' : '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '4px 2px',
                  fontSize: 9,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Pelo menos 1
              </button>
              <button
                type="button"
                onClick={() => setCriterioBusca('todas')}
                style={{
                  flex: 1,
                  background: criterioBusca === 'todas' ? '#0284c7' : '#f1f5f9',
                  color: criterioBusca === 'todas' ? '#fff' : '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '4px 2px',
                  fontSize: 9,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Todas juntas
              </button>
            </div>

            {/* GRADE 20x5 DO RAIO-X */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#f8fafc', padding: 6, borderRadius: 6, border: '1px solid #e2e8f0' }}>
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
                          width: 32,
                          height: 24,
                          fontSize: 10,
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 4,
                          cursor: 'pointer',
                          background: ativo ? '#0284c7' : '#ffffff',
                          color: ativo ? '#ffffff' : '#334155',
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
        )}

        {/* TELA BRANCA DE CARTELAS DA BANCADA */}
        <main style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 16, minHeight: '80vh', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
              MESA DE TESTE ({cartelasMesa.length} cartelas ativas na tela)
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {dezenasRaioX.length > 0 
                ? `Dezenas Raio-X: [ ${dezenasRaioX.map(n => (n === 100 ? '00' : n.toString().padStart(2, '0'))).join(', ')} ]`
                : 'Clique no cartão Raio-X ao lado para trazer as cartelas para cá.'}
            </span>
          </div>

          {cartelasMesa.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🩻</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>A tela branca está limpa.</div>
              <p style={{ fontSize: 12, margin: '6px 0 0' }}>
                Clique em qualquer número no cartão Raio-X à esquerda para trazer instantaneamente as cartelas fixas que o possuem.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
              {cartelasMesa.map(c => {
                const estaFixada = cartelasFixadasIds.includes(c.id);
                // Conta quantas dezenas do raio-x batem nesta cartela
                const cruzamentos = dezenasRaioX.filter(n => c.dezenas.includes(n));

                return (
                  <div
                    key={c.id}
                    style={{
                      background: '#fff',
                      border: estaFixada ? '2px solid #f59e0b' : cruzamentos.length > 0 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: estaFixada ? '0 4px 10px rgba(245, 158, 11, 0.15)' : 'none'
                    }}
                  >
                    {/* BARRA SUPERIOR DA CARTELA COM PIN (FIXAR) */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#0284c7' }}>
                        Cartela #{c.numeroCartela}
                      </span>
                      
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {cruzamentos.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 900, background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 4 }}>
                            {cruzamentos.length} match
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => alternarFixarCartela(c.id)}
                          title={estaFixada ? 'Desafixar da tela branca' : 'Fixar permanentemente na tela branca'}
                          style={{
                            background: estaFixada ? '#f59e0b' : '#f1f5f9',
                            border: estaFixada ? '1px solid #d97706' : '1px solid #cbd5e1',
                            color: estaFixada ? '#fff' : '#64748b',
                            borderRadius: 4,
                            padding: '2px 5px',
                            cursor: 'pointer',
                            fontSize: 10,
                            fontWeight: 800
                          }}
                        >
                          {estaFixada ? '📌 Fixada' : 'Pin 📌'}
                        </button>
                      </div>
                    </div>

                    {/* MATRIZ REAL 20x5 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {c.selecionadas.map((linha, lIdx) => (
                        <div key={lIdx} style={{ display: 'flex', gap: 2 }}>
                          {linha.map((val, colIdx) => {
                            const num = lIdx * COLUNAS_QTD + colIdx + 1;
                            const marcado = val === 1 || val === 2;
                            const bateuNoRaioX = dezenasRaioX.includes(num);

                            let bg = '#f1f5f9';
                            let color = '#94a3b8';
                            let border = '1px solid #e2e8f0';

                            if (marcado) {
                              if (bateuNoRaioX) {
                                bg = '#dc2626'; // Vermelho quente de destaque
                                color = '#ffffff';
                                border = '1px solid #991b1b';
                              } else {
                                bg = '#2563eb';
                                color = '#ffffff';
                              }
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
                                  border: border
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
    </div>
  );
}