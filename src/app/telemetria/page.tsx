'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  COLUNAS_QTD, 
  LINHAS_QTD, 
  TOTAL_CASAS,
  RadiografiaCartela, 
  analisarCartela,
  sintetizarCartelasOtimizadas
} from './radiografiaMotor';

interface CartelaSintetizada {
  id: string;
  numeroCartela: number;
  dezenas: number[];
  selecionadas: number[][];
}

export default function TelemetriaBidimensional() {
  const [cartelas, setCartelas] = useState<RadiografiaCartela[]>([]);

  // Modos de visualização
  const [modoVisao, setModoVisao] = useState<'raioX' | 'faixas'>('raioX');

  // Dezenas digitadas no Cartão Raio-X
  const [dezenasRaioX, setDezenasRaioX] = useState<number[]>([]);
  const [criterioBusca, setCriterioBusca] = useState<'peloMenosUm' | 'todas'>('peloMenosUm');

  // Cartelas fixadas na mesa
  const [cartelasFixadasIds, setCartelasFixadasIds] = useState<(string | number)[]>([]);

  // Filtros de faixas e colunas
  const [faixasEscolhidas, setFaixasEscolhidas] = useState<number[]>([]);
  const [densidadeFaixas, setDensidadeFaixas] = useState<string>('0_ou_1');
  const [colunasEscolhidas, setColunasEscolhidas] = useState<number[]>([]);
  const [filtroColunaMin, setFiltroColunaMin] = useState<number>(0);
  const [minAglomerado, setMinAglomerado] = useState<number>(0);

  // --- ESTADOS DO SINTETIZADOR COMBINATÓRIO FLUTUANTE ---
  const [painelFlutuanteAberto, setPainelFlutuanteAberto] = useState<boolean>(true);
  const [fonteDezenas, setFonteDezenas] = useState<'raioX' | 'telaToda'>('telaToda');
  const [alvoPontos, setAlvoPontos] = useState<number>(15);
  const [limiteQtdDezenas, setLimiteQtdDezenas] = useState<number>(0);
  const [cartelasGeradas, setCartelasGeradas] = useState<CartelaSintetizada[]>([]);

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

  // Cartelas visíveis na tela branca da mesa
  const cartelasMesa = useMemo(() => {
    if (modoVisao === 'raioX') {
      if (dezenasRaioX.length === 0) {
        return cartelas.filter(c => cartelasFixadasIds.includes(c.id));
      }
      return cartelas.filter(c => {
        if (cartelasFixadasIds.includes(c.id)) return true;
        if (criterioBusca === 'peloMenosUm') {
          return dezenasRaioX.some(d => c.dezenas.includes(d));
        } else {
          return dezenasRaioX.every(d => c.dezenas.includes(d));
        }
      });
    }

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
        if (!colunasEscolhidas.every(cIdx => c.colunasPontos[cIdx] >= filtroColunaMin)) return false;
      }
      if (minAglomerado > 0 && c.maiorIlhaContigua < minAglomerado) return false;
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

  // Universo de todas as dezenas únicas presentes nas cartelas ativas na tela branca
  const universoDezenasTela = useMemo(() => {
    const unicas = new Set<number>();
    cartelasMesa.forEach(c => c.dezenas.forEach(d => unicas.add(d)));
    return Array.from(unicas).sort((a, b) => a - b);
  }, [cartelasMesa]);

  // Dispara o motor de síntese
  const executarSintese = () => {
    const base = fonteDezenas === 'raioX' ? dezenasRaioX : universoDezenasTela;
    if (base.length === 0) {
      alert('Selecione dezenas no Raio-X ou traga cartelas para a mesa antes de gerar.');
      return;
    }
    const resultado = sintetizarCartelasOtimizadas(base, alvoPontos, limiteQtdDezenas);
    setCartelasGeradas(resultado);
  };

  // Alterna número manualmente dentro de uma cartela sintetizada
  const toggleNumeroNaGerada = (cartelaId: string, num: number) => {
    setCartelasGeradas(prev =>
      prev.map(c => {
        if (c.id !== cartelaId) return c;
        const jaTem = c.dezenas.includes(num);
        let novasDezenas = jaTem ? c.dezenas.filter(n => n !== num) : [...c.dezenas, num];
        novasDezenas.sort((a, b) => a - b);

        const novaMatriz = Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0));
        novasDezenas.forEach(n => {
          const idx = n - 1;
          const l = Math.floor(idx / COLUNAS_QTD);
          const col = idx % COLUNAS_QTD;
          if (l >= 0 && l < LINHAS_QTD && col >= 0 && col < COLUNAS_QTD) {
            novaMatriz[l][col] = 1;
          }
        });

        return { ...c, dezenas: novasDezenas, selecionadas: novaMatriz };
      })
    );
  };

  // Salva a cartela sintetizada no localStorage da bancada principal
  const exportarParaBancadaPrincipal = (cartela: CartelaSintetizada) => {
    try {
      const raw = localStorage.getItem('gerador_cartelas_fixas_5x20') || '[]';
      const lista = JSON.parse(raw);
      const novoId = Date.now();
      const novoItem = {
        id: novoId,
        numeroCartela: lista.length + 1,
        selecionadas: cartela.selecionadas
      };
      const atualizada = [...lista, novoItem];
      localStorage.setItem('gerador_cartelas_fixas_5x20', JSON.stringify(atualizada));
      carregarDados();
      alert(`Cartela #${cartela.numeroCartela} enviada com sucesso para a Bancada Principal!`);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar cartela na bancada.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#0f172a', padding: 16, fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* CABEÇALHO */}
      <header style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 900, color: '#0f172a' }}>
            💡 MESA DE LUZ & SINTETIZADOR BIDIMENSIONAL
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#64748b' }}>
            Bancada: <b>{cartelas.length} cartelas</b> | Visíveis: <b>{cartelasMesa.length}</b> | Dezenas no Universo da Tela: <b>{universoDezenasTela.length}</b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setModoVisao(m => (m === 'raioX' ? 'faixas' : 'raioX'))}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            {modoVisao === 'raioX' ? 'Ver Modo Faixas' : 'Ver Modo Raio-X'}
          </button>

          <button
            type="button"
            onClick={() => setPainelFlutuanteAberto(v => !v)}
            style={{ background: painelFlutuanteAberto ? '#7c3aed' : '#ede9fe', color: painelFlutuanteAberto ? '#fff' : '#6d28d9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
          >
            🚀 {painelFlutuanteAberto ? 'Minimizar Sintetizador' : 'Abrir Sintetizador Combinatório'}
          </button>

          <button
            type="button"
            onClick={carregarDados}
            style={{ background: '#0f172a', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            🔄 Sincronizar
          </button>
        </div>
      </header>

      {/* ÁREA DE TRABALHO (RAIO-X + TELA BRANCA) */}
      <div style={{ display: 'grid', gridTemplateColumns: modoVisao === 'raioX' ? '230px 1fr' : '1fr', gap: 14, alignItems: 'start' }}>
        
        {/* CARTÃO RAIO-X LATERAL */}
        {modoVisao === 'raioX' && (
          <aside style={{ background: '#fff', border: '2px solid #0284c7', borderRadius: 8, padding: 10, position: 'sticky', top: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#0284c7' }}>🩻 CARTÃO RAIO-X</span>
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
        )}

        {/* TELA BRANCA DE CARTELAS DA BANCADA */}
        <main style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, minHeight: '80vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>
              Cartelas da Bancada na Tela ({cartelasMesa.length})
            </span>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              Dezenas únicas reunidas: <b>{universoDezenasTela.length} números</b>
            </span>
          </div>

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

                  {/* GRID 20x5 */}
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
        </main>
      </div>

      {/* ========================================================= */}
      {/* PAINEL FLUTUANTE DO SINTETIZADOR COMBINATÓRIO             */}
      {/* ========================================================= */}
      {painelFlutuanteAberto && (
        <section
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            width: 480,
            maxHeight: '85vh',
            background: '#ffffff',
            border: '2px solid #7c3aed',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* TOPO DO PAINEL */}
          <div style={{ background: '#7c3aed', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>🚀 SINTETIZADOR COMBINATÓRIO FLUTUANTE</span>
            <button
              type="button"
              onClick={() => setPainelFlutuanteAberto(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* CONFIGURAÇÃO DE ENTRADA */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, fontSize: 11 }}>
              <div style={{ fontWeight: 800, color: '#334155', marginBottom: 4 }}>1. Matéria-Prima de Dezenas:</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => setFonteDezenas('telaToda')}
                  style={{
                    flex: 1,
                    background: fonteDezenas === 'telaToda' ? '#7c3aed' : '#fff',
                    color: fonteDezenas === 'telaToda' ? '#fff' : '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    padding: '4px 6px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🌐 Universo da Tela ({universoDezenasTela.length} dezenas)
                </button>
                <button
                  type="button"
                  onClick={() => setFonteDezenas('raioX')}
                  style={{
                    flex: 1,
                    background: fonteDezenas === 'raioX' ? '#7c3aed' : '#fff',
                    color: fonteDezenas === 'raioX' ? '#fff' : '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    padding: '4px 6px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🎯 Só Números do Raio-X ({dezenasRaioX.length})
                </button>
              </div>

              {/* LIMITE DE DEZENAS */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#64748b' }}>Limitar quantidade de dezenas usadas:</span>
                <input
                  type="number"
                  placeholder="Ex: 60 (0 = todas)"
                  value={limiteQtdDezenas === 0 ? '' : limiteQtdDezenas}
                  onChange={e => setLimiteQtdDezenas(Number(e.target.value) || 0)}
                  style={{ width: 110, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11 }}
                />
              </div>
            </div>

            {/* SELEÇÃO DO ALVO DE PONTOS */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, fontSize: 11 }}>
              <div style={{ fontWeight: 800, color: '#334155', marginBottom: 4 }}>2. Garantia de Alvo:</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[15, 16, 17, 18, 19].map(pts => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setAlvoPontos(pts)}
                    style={{
                      flex: 1,
                      background: alvoPontos === pts ? '#0f172a' : '#fff',
                      color: alvoPontos === pts ? '#fff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      padding: '4px 0',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {pts} Pts
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÃO GERADOR */}
            <button
              type="button"
              onClick={executarSintese}
              style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
            >
              ⚙️ Calcular Mínimo de Cartelas para {alvoPontos} Pontos
            </button>

            {/* CARTELAS SINTETIZADAS COM EDIÇÃO MANUAL */}
            {cartelasGeradas.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cartelas Geradas ({cartelasGeradas.length}):</span>
                  <span style={{ color: '#64748b' }}>Clique nos números para editar</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cartelasGeradas.map(cg => (
                    <div
                      key={cg.id}
                      style={{
                        background: '#fdf4ff',
                        border: '1px solid #d8b4fe',
                        borderRadius: 6,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed' }}>
                          Sintetizada #{cg.numeroCartela} ({cg.dezenas.length} dezenas)
                        </span>
                        <button
                          type="button"
                          onClick={() => exportarParaBancadaPrincipal(cg)}
                          style={{
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Salvar na Bancada 📥
                        </button>
                      </div>

                      {/* GRADE 20x5 EDITÁVEL AO CLIQUE */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Array.from({ length: LINHAS_QTD }, (_, lIdx) => (
                          <div key={lIdx} style={{ display: 'flex', gap: 1 }}>
                            {Array.from({ length: COLUNAS_QTD }, (_, colIdx) => {
                              const num = lIdx * COLUNAS_QTD + colIdx + 1;
                              const marcado = cg.dezenas.includes(num);

                              return (
                                <button
                                  key={colIdx}
                                  type="button"
                                  onClick={() => toggleNumeroNaGerada(cg.id, num)}
                                  title={`Dezena ${(num === 100 ? 0 : num).toString().padStart(2, '0')}`}
                                  style={{
                                    width: 22,
                                    height: 18,
                                    fontSize: 8,
                                    fontWeight: 800,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    border: '1px solid #e9d5ff',
                                    background: marcado ? '#7c3aed' : '#ffffff',
                                    color: marcado ? '#ffffff' : '#a855f7',
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}