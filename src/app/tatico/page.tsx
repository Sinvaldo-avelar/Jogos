"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

const COLUNAS_QTD = 5;
const LINHAS_QTD = 20;
const NUMS = Array.from({ length: COLUNAS_QTD }, (_, i) => i + 1);

const STORAGE_CARTELAS_FIXAS_KEY = "gerador_cartelas_fixas_5x20";
const STORAGE_CARTELAS_SALVAS_KEY = "gerador_cartelas_5x20_salvas";
const STORAGE_GABARITOS_KEY = "gerador_gabaritos_5x20_transparentes";
const STORAGE_TRAVA_GERAL_KEY = "gerador_trava_geral_5x20";

const CORES_GABARITO = [
  { solido: '#dc2626', borda: '#991b1b', nome: 'Vermelho' },
  { solido: '#16a34a', borda: '#15803d', nome: 'Verde' },
  { solido: '#9333ea', borda: '#7e22ce', nome: 'Roxo' },
  { solido: '#ea580c', borda: '#c2410c', nome: 'Laranja' },
];

interface Gabarito5x20 {
  id: number;
  x: number;
  y: number;
  valores: number[][];
  corIdx: number;
}

interface CartelaFixa5x20Item {
  id: number;
  selecionadas: number[][];
  msg: string;
  bloqueada?: boolean;
}

function CartaoMontarJogo({ 
  cartela, 
  indice, 
  alternarNumero, 
  salvarCartela, 
  removerCartela, 
  alternarTravaIndividual,
  travaGeralAtiva,
  celulaCartelaStyle 
}: any) {
  const estaTravada = travaGeralAtiva || cartela.bloqueada;

  const totalEscolhidos = cartela.selecionadas.reduce(
    (acc: number, linha: number[]) => acc + linha.filter(v => v === 1 || v === 2).length,
    0
  );

  return (
    <div style={{
      ...styles.cardPrincipal,
      border: estaTravada ? '1px solid #fca5a5' : '1px solid #e2e8f0',
      background: estaTravada ? '#fffbfa' : '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={styles.cardTitle}>CARTELA #{indice + 1}</h3>
          <button
            type="button"
            onClick={() => alternarTravaIndividual(cartela.id)}
            style={{
              background: estaTravada ? '#fee2e2' : '#f1f5f9',
              color: estaTravada ? '#dc2626' : '#475569',
              border: 'none',
              borderRadius: 4,
              padding: '2px 5px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title={estaTravada ? "Cartela bloqueada contra cliques" : "Travar esta cartela"}
          >
            {estaTravada ? '🔒 Travada' : '🔓 Aberta'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => removerCartela(cartela.id)}
          style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          title="Remover esta cartela"
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 8, fontWeight: 600, color: '#0f172a', fontSize: 13, textAlign: 'center' }}>
        Escolhidos: {totalEscolhidos}
      </div>

      <div style={{
        ...styles.gradeSelecao,
        pointerEvents: estaTravada ? 'none' : 'auto',
        opacity: estaTravada ? 0.88 : 1,
        userSelect: 'none'
      }}>
        {Array.from({ length: LINHAS_QTD }, (_, linhaIdx) => (
          <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
            {NUMS.map(num => {
              const estado = cartela.selecionadas[linhaIdx][num - 1];
              const numero = linhaIdx * COLUNAS_QTD + num;
              let background = "#fff";
              let color = "#334155";
              let border = "1px solid #cbd5e1";

              if (estado === 1) {
                background = "#3b82f6";
                color = "#fff";
                border = "2px solid #2563eb";
              } else if (estado === 2) {
                background = "#ef4444";
                color = "#fff";
                border = "2px solid #b91c1c";
              }

              return (
                <button
                  key={num}
                  disabled={estaTravada}
                  style={{
                    ...(celulaCartelaStyle || styles.celulaCartela),
                    background,
                    color,
                    border,
                    cursor: estaTravada ? "default" : "pointer",
                  }}
                  onClick={() => alternarNumero(cartela.id, linhaIdx, num)}
                >
                  {(numero === 100 ? 0 : numero).toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button
        disabled={estaTravada}
        style={{
          ...styles.btnSalvar,
          background: estaTravada ? "#94a3b8" : "#16a34a",
          cursor: estaTravada ? "not-allowed" : "pointer"
        }}
        onClick={() => salvarCartela(cartela.id)}
      >
        {estaTravada ? "CARTELA TRAVADA" : "SALVAR"}
      </button>
      {cartela.msg && <div style={{ color: '#16a34a', marginTop: 6, fontWeight: 600, fontSize: 12, textAlign: 'center' }}>{cartela.msg}</div>}
    </div>
  );
}

export default function Gerador() {
  const [montado, setMontado] = useState(false);
  const [salvos, setSalvos] = useState<number[][][]>([]);
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [cartelaEditTemp, setCartelaEditTemp] = useState<number[][] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gabaritos, setGabaritos] = useState<Gabarito5x20[]>([]);
  const [travaGeral, setTravaGeral] = useState(false);
  const [cartelasFixas, setCartelasFixas] = useState<CartelaFixa5x20Item[]>([]);

  // Estados do Raio-X
  const [painelRaioXAberto, setPainelRaioXAberto] = useState(false);
  const [raioXPos, setRaioXPos] = useState({ x: 40, y: 100 });
  const [qtdTopCustom, setQtdTopCustom] = useState<number>(20);

  // PONTEIRO DA RODATÓRIA CONTÍNUA (BUFFER CIRCULAR)
  const [ponteiroCarrossel, setPonteiroCarrossel] = useState<number>(0);

  const gerarGradeVazia = () => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0));

  useEffect(() => {
    const fixasSalvas = localStorage.getItem(STORAGE_CARTELAS_FIXAS_KEY);
    if (fixasSalvas) {
      setCartelasFixas(JSON.parse(fixasSalvas));
    } else {
      setCartelasFixas([
        { id: 1, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
        { id: 2, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
        { id: 3, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
        { id: 4, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
      ]);
    }

    const s = localStorage.getItem(STORAGE_CARTELAS_SALVAS_KEY);
    if (s) setSalvos(JSON.parse(s));

    const gSalvos = localStorage.getItem(STORAGE_GABARITOS_KEY);
    if (gSalvos) setGabaritos(JSON.parse(gSalvos));

    const travaSalva = localStorage.getItem(STORAGE_TRAVA_GERAL_KEY);
    if (travaSalva) setTravaGeral(JSON.parse(travaSalva));
    
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    handleResize();
    window.addEventListener('resize', handleResize);
    setMontado(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_CARTELAS_FIXAS_KEY, JSON.stringify(cartelasFixas));
  }, [cartelasFixas, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_CARTELAS_SALVAS_KEY, JSON.stringify(salvos));
  }, [salvos, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_GABARITOS_KEY, JSON.stringify(gabaritos));
  }, [gabaritos, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_TRAVA_GERAL_KEY, JSON.stringify(travaGeral));
  }, [travaGeral, montado]);

  const alternarTravaGeral = () => setTravaGeral(prev => !prev);

  const alternarTravaIndividual = (id: number) => {
    setCartelasFixas(prev => prev.map(c => 
      c.id === id ? { ...c, bloqueada: !c.bloqueada } : c
    ));
  };

  const adicionarCartelaFixa = () => {
    setCartelasFixas(prev => [
      ...prev,
      { id: Date.now(), selecionadas: gerarGradeVazia(), msg: "", bloqueada: false }
    ]);
  };

  const removerCartelaFixa = (id: number) => {
    if (cartelasFixas.length <= 1) {
      alert("Mantenha ao menos 1 cartela fixa!");
      return;
    }
    setCartelasFixas(prev => prev.filter(c => c.id !== id));
  };

  const alternarNumeroCartelaFixa = (id: number, linhaIdx: number, num: number) => {
    setCartelasFixas(prev => prev.map(cartela => {
      if (cartela.id !== id) return cartela;
      const idx = num - 1;
      const novaGrade = cartela.selecionadas.map((linha, lIdx) => {
        if (lIdx !== linhaIdx) return linha;
        const novaLinha = [...linha];
        novaLinha[idx] = (novaLinha[idx] + 1) % 3;
        return novaLinha;
      });
      return { ...cartela, selecionadas: novaGrade, msg: "" };
    }));
  };

  const salvarCartelaFixa = (id: number) => {
    const cartela = cartelasFixas.find(c => c.id === id);
    if (!cartela) return;

    const jaSalvo = salvos.some(s => JSON.stringify(s) === JSON.stringify(cartela.selecionadas));
    if (jaSalvo) {
      setCartelasFixas(prev => prev.map(c => c.id === id ? { ...c, msg: "⚠️ Já foi salva!" } : c));
      return;
    }

    const novosSalvos = [cartela.selecionadas.map(l => [...l]), ...salvos];
    setSalvos(novosSalvos);

    setCartelasFixas(prev => prev.map(c => {
      if (c.id !== id) return c;
      const resetComFixos = c.selecionadas.map(linha => linha.map(v => (v === 2 ? 2 : 0)));
      return { ...c, selecionadas: resetComFixos, msg: "Salva com sucesso!" };
    }));
  };

  const arrastoRef = useRef<{ id: number | null; startX: number; startY: number; origemX: number; origemY: number }>({
    id: null, startX: 0, startY: 0, origemX: 0, origemY: 0,
  });

  const arrastoRaioXRef = useRef<{ ativo: boolean; startX: number; startY: number; origemX: number; origemY: number }>({
    ativo: false, startX: 0, startY: 0, origemX: 0, origemY: 0,
  });

  useEffect(() => {
    const aoMoverRato = (e: MouseEvent) => {
      if (arrastoRef.current.id !== null) {
        const { id, startX, startY, origemX, origemY } = arrastoRef.current;
        setGabaritos((anteriores) =>
          anteriores.map((gab) => {
            if (gab.id !== id) return gab;
            return { ...gab, x: Math.max(10, origemX + (e.clientX - startX)), y: Math.max(10, origemY + (e.clientY - startY)) };
          })
        );
      }

      if (arrastoRaioXRef.current.ativo) {
        const { startX, startY, origemX, origemY } = arrastoRaioXRef.current;
        setRaioXPos({
          x: Math.max(10, origemX + (e.clientX - startX)),
          y: Math.max(10, origemY + (e.clientY - startY))
        });
      }
    };

    const aoSoltarRato = () => { 
      arrastoRef.current.id = null;
      arrastoRaioXRef.current.ativo = false;
    };

    window.addEventListener('mousemove', aoMoverRato);
    window.addEventListener('mouseup', aoSoltarRato);
    return () => {
      window.removeEventListener('mousemove', aoMoverRato);
      window.removeEventListener('mouseup', aoSoltarRato);
    };
  }, []);

  const iniciarArrastoGabarito = (e: React.MouseEvent, gab: Gabarito5x20) => {
    arrastoRef.current = { id: gab.id, startX: e.clientX, startY: e.clientY, origemX: gab.x, origemY: gab.y };
  };

  const iniciarArrastoRaioX = (e: React.MouseEvent) => {
    arrastoRaioXRef.current = {
      ativo: true,
      startX: e.clientX,
      startY: e.clientY,
      origemX: raioXPos.x,
      origemY: raioXPos.y
    };
  };

  const adicionarGabarito = () => {
    const novo: Gabarito5x20 = {
      id: Date.now(),
      x: 120 + (gabaritos.length % 4) * 30,
      y: 90 + (gabaritos.length % 4) * 30,
      valores: gerarGradeVazia(),
      corIdx: gabaritos.length % CORES_GABARITO.length,
    };
    setGabaritos((prev) => [...prev, novo]);
  };

  const alternarNumeroGabarito = (idGabarito: number, linhaIdx: number, numIdx: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) => {
        if (gab.id !== idGabarito) return gab;
        const novosValores = gab.valores.map((linha, lIdx) =>
          lIdx === linhaIdx ? linha.map((val, nIdx) => (nIdx === numIdx ? (val === 0 ? 1 : 0) : val)) : [...linha]
        );
        return { ...gab, valores: novosValores };
      })
    );
  };

  const limparGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) => gab.id === idGabarito ? { ...gab, valores: gerarGradeVazia() } : gab)
    );
  };

  const excluirGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) => anteriores.filter((gab) => gab.id !== idGabarito));
  };

  const alternarNumeroEdit = (linhaIdx: number, idx2: number) => {
    setCartelaEditTemp(prev => prev!.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const novoArr = [...linha];
      novoArr[idx2] = (novoArr[idx2] + 1) % 3;
      return novoArr;
    }));
  };

  const estatisticas100 = useMemo(() => {
    const contadores: number[] = Array(100).fill(0);

    cartelasFixas.forEach(cartela => {
      cartela.selecionadas.forEach((linha, lIdx) => {
        linha.forEach((val, cIdx) => {
          if (val === 1 || val === 2) {
            const numero = lIdx * COLUNAS_QTD + cIdx + 1;
            contadores[numero - 1] += 1;
          }
        });
      });
    });

    salvos.forEach(grade => {
      grade.forEach((linha, lIdx) => {
        linha.forEach((val, cIdx) => {
          if (val === 1 || val === 2) {
            const numero = lIdx * COLUNAS_QTD + cIdx + 1;
            contadores[numero - 1] += 1;
          }
        });
      });
    });

    const lista = contadores.map((qtd, idx) => {
      const numReal = idx + 1;
      const formatado = (numReal === 100 ? 0 : numReal).toString().padStart(2, "0");
      return { numero: formatado, valorBruto: numReal, qtd };
    });

    const ordenadosPorUso = [...lista].sort((a, b) => b.qtd - a.qtd);
    const naoUsados = lista.filter(item => item.qtd === 0);
    const maxQtd = Math.max(...contadores, 1);

    return { lista, ordenadosPorUso, naoUsados, maxQtd, totalJogos: cartelasFixas.length + salvos.length };
  }, [cartelasFixas, salvos]);

  const alternarDezenaNoGabaritoAtivo = (valorBruto: number) => {
    let gabAlvoId: number;

    if (gabaritos.length === 0) {
      const novoId = Date.now();
      const novo: Gabarito5x20 = {
        id: novoId,
        x: 180,
        y: 100,
        valores: gerarGradeVazia(),
        corIdx: 0,
      };
      setGabaritos([novo]);
      gabAlvoId = novoId;
    } else {
      gabAlvoId = gabaritos[gabaritos.length - 1].id;
    }

    const linhaIdx = Math.floor((valorBruto - 1) / COLUNAS_QTD);
    const colIdx = (valorBruto - 1) % COLUNAS_QTD;

    setGabaritos(prev => prev.map(gab => {
      if (gab.id !== gabAlvoId) return gab;
      const novosValores = gab.valores.map((linha, lIdx) =>
        lIdx === linhaIdx
          ? linha.map((val, cIdx) => (cIdx === colIdx ? (val === 0 ? 1 : 0) : val))
          : [...linha]
      );
      return { ...gab, valores: novosValores };
    }));
  };

  // EXPORTAÇÃO EM RODATÓRIA CONTÍNUA (RODA E VOLTA AO TOPO)
  const exportarTopParaGabarito = (quantidade: number) => {
    const dezenasDisponiveis = estatisticas100.ordenadosPorUso.filter(item => item.qtd > 0);

    if (dezenasDisponiveis.length === 0) {
      alert("Nenhuma dezena marcada nas cartelas para gerar gabarito!");
      return;
    }

    const totalDisponiveis = dezenasDisponiveis.length;
    const qtdReal = Math.min(Math.max(1, quantidade), 100);

    const selecionados: number[] = [];
    let idxAtual = ponteiroCarrossel;

    // Percorre a lista em carrossel circular
    for (let i = 0; i < qtdReal; i++) {
      const dezenaItem = dezenasDisponiveis[idxAtual % totalDisponiveis];
      
      if (!selecionados.includes(dezenaItem.valorBruto)) {
        selecionados.push(dezenaItem.valorBruto);
      }

      idxAtual = (idxAtual + 1) % totalDisponiveis;
    }

    // Grava a nova posição onde o ponteiro parou
    setPonteiroCarrossel(idxAtual);

    const novaGrade = gerarGradeVazia();
    selecionados.forEach(num => {
      const linha = Math.floor((num - 1) / COLUNAS_QTD);
      const col = (num - 1) % COLUNAS_QTD;
      novaGrade[linha][col] = 1;
    });

    const novoGab: Gabarito5x20 = {
      id: Date.now(),
      x: 150 + (gabaritos.length % 4) * 35,
      y: 120 + (gabaritos.length % 4) * 35,
      valores: novaGrade,
      corIdx: gabaritos.length % CORES_GABARITO.length,
    };

    setGabaritos(prev => [...prev, novoGab]);
  };

  if (!montado) return null;

  const celulaEstilo = {
    ...styles.celulaCartela,
    width: isMobile ? 26 : 24,
    height: isMobile ? 26 : 24,
    fontSize: isMobile ? 13 : 10,
  };

  return (
    <div style={{ ...styles.container, padding: isMobile ? '10px' : '40px 20px' }}>
      
      {/* PAINEL FLUTUANTE DO RAIO-X */}
      {painelRaioXAberto && (
        <div style={{
          ...styles.janelaFlutuanteRaioX,
          left: isMobile ? 10 : raioXPos.x,
          top: isMobile ? 10 : raioXPos.y,
          width: isMobile ? '95%' : 540,
        }}>
          <div 
            onMouseDown={iniciarArrastoRaioX}
            style={styles.alcaJanelaFlutuante}
            title="Clique e arraste para reposicionar esta janela"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>✥</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>
                RAIO-X (CLIQUE P/ GABARITO • RODATÓRIA ATIVA)
              </span>
            </div>
            <button 
              onClick={() => setPainelRaioXAberto(false)} 
              style={styles.btnFecharFlutuante}
            >
              ✕
            </button>
          </div>

          <div style={styles.corpoFlutuante}>
            {/* Input e controle da Rodatória */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              flexWrap: 'wrap', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: '#f8fafc',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>
                  Exportar:
                </span>
                <input 
                  type="number"
                  min={1}
                  max={100}
                  value={qtdTopCustom}
                  onChange={(e) => setQtdTopCustom(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  style={{
                    width: 52,
                    padding: '3px 6px',
                    fontSize: 12,
                    fontWeight: 800,
                    textAlign: 'center',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    color: '#0f172a',
                    background: '#fff'
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                  dezenas
                </span>
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button 
                  type="button" 
                  onClick={() => exportarTopParaGabarito(qtdTopCustom)} 
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Gera o gabarito no fluxo contínuo (carrossel)"
                >
                  ⚡ Gerar Gabarito
                </button>

                <button 
                  type="button" 
                  onClick={() => {
                    setPonteiroCarrossel(0);
                    alert("Rodatória reiniciada! O próximo gabarito começará do Top #1.");
                  }} 
                  style={{
                    background: '#fff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '5px 8px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title="Reinicia a contagem do carrossel para o 1º colocado"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            {/* Mapa 10x10 Interativo */}
            <div style={styles.gridMapaCalorFlutuante}>
              {estatisticas100.lista.map(item => {
                const semUso = item.qtd === 0;
                const maisUsado = item.qtd >= estatisticas100.maxQtd && item.qtd > 1;

                return (
                  <button
                    key={item.numero}
                    type="button"
                    onClick={() => alternarDezenaNoGabaritoAtivo(item.valorBruto)}
                    title={`Dezena ${item.numero} (usada ${item.qtd}x). Clique para marcar no Gabarito!`}
                    style={{
                      ...styles.celulaMapaFlutuante,
                      background: semUso ? '#f8fafc' : maisUsado ? '#dcfce7' : '#e0f2fe',
                      borderColor: semUso ? '#e2e8f0' : maisUsado ? '#86efac' : '#bae6fd',
                      opacity: semUso ? 0.4 : 1,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: semUso ? '#94a3b8' : maisUsado ? '#15803d' : '#0369a1' }}>
                      {item.numero}
                    </span>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: semUso ? '#94a3b8' : maisUsado ? '#166534' : '#1e40af'
                    }}>
                      {item.qtd}x
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#64748b' }}>
              <span>Zonas mortas: <b>{estatisticas100.naoUsados.length} dezenas</b></span>
              <span>Ponteiro na fila: <b>Posição #{ponteiroCarrossel + 1}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* Camada dos Gabaritos Flutuantes */}
      {gabaritos.map((gab, idx) => {
        const cor = CORES_GABARITO[gab.corIdx];
        const marcadosNoGabarito = gab.valores.reduce(
          (acc, linha) => acc + linha.filter(v => v > 0).length,
          0
        );

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
              <span style={{ fontSize: 11, fontWeight: 900, color: cor.borda }}>G{idx + 1}</span>
              <span style={styles.badgeContadorGabarito}>{marcadosNoGabarito}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {marcadosNoGabarito > 0 && (
                  <button type="button" onClick={() => limparGabarito(gab.id)} style={styles.btnAcaoMini} title="Limpar">↺</button>
                )}
                <button type="button" onClick={() => excluirGabarito(gab.id)} style={{ ...styles.btnAcaoMini, color: '#dc2626' }} title="Fechar">×</button>
              </div>
            </div>

            <div style={{ ...styles.gradeSelecao, pointerEvents: 'none' }}>
              {Array.from({ length: LINHAS_QTD }, (_, linhaIdx) => (
                <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
                  {NUMS.map((num, numIdx) => {
                    const numero = linhaIdx * COLUNAS_QTD + num;
                    const ativo = gab.valores[linhaIdx][numIdx] === 1;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => alternarNumeroGabarito(gab.id, linhaIdx, numIdx)}
                        style={{
                          ...celulaEstilo,
                          background: ativo ? cor.solido : 'transparent',
                          borderColor: ativo ? cor.borda : 'transparent',
                          color: ativo ? '#ffffff' : 'transparent',
                          borderStyle: 'solid',
                          borderWidth: ativo ? 2 : 1,
                          boxShadow: ativo ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                        }}
                      >
                        {ativo ? (numero === 100 ? 0 : numero).toString().padStart(2, "0") : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Barra de Topo com Ações */}
      <div style={styles.topoAcoesBar}>
        <button style={styles.btnVoltar} onClick={() => window.location.href = '/'}>
          ⬅ Voltar para Painel
        </button>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPainelRaioXAberto(prev => !prev)}
            style={{
              ...styles.btnRaioX,
              background: painelRaioXAberto ? '#0369a1' : '#0284c7',
            }}
            title="Abrir painel flutuante de frequência das dezenas"
          >
            {painelRaioXAberto ? "📊 Fechar Raio-X" : "📊 Abrir Raio-X Flutuante"}
          </button>

          <button
            type="button"
            onClick={alternarTravaGeral}
            style={{
              ...styles.btnAcaoTopo,
              background: travaGeral ? '#fee2e2' : '#dcfce7',
              color: travaGeral ? '#b91c1c' : '#15803d',
              border: travaGeral ? '1px solid #f87171' : '1px solid #86efac',
            }}
            title={travaGeral ? "Cartelas travadas contra cliques" : "Travar todas as cartelas"}
          >
            {travaGeral ? "🔒 TRAVA GERAL: LIGADA" : "🔓 TRAVA GERAL: LIVRE"}
          </button>

          <button
            type="button"
            style={styles.btnAdicionarCartelaFixa}
            onClick={adicionarCartelaFixa}
          >
            ➕ Adicionar Cartela ({cartelasFixas.length})
          </button>
          
          <button
            type="button"
            style={styles.btnNovoGabarito}
            onClick={adicionarGabarito}
          >
            📋 + Cartela Gabarito {gabaritos.length > 0 && `(${gabaritos.length})`}
          </button>
        </div>
      </div>

      <h1 style={styles.title}>GERADOR TÁTICO 5x20</h1>

      {/* Cartelas Fixas da Bancada */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? 14 : 12,
        maxWidth: 1300,
        margin: '0 auto',
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        {cartelasFixas.map((cartela, idx) => (
          <CartaoMontarJogo 
            key={cartela.id}
            cartela={cartela}
            indice={idx}
            alternarNumero={alternarNumeroCartelaFixa}
            salvarCartela={salvarCartelaFixa}
            removerCartela={removerCartelaFixa}
            alternarTravaIndividual={alternarTravaIndividual}
            travaGeralAtiva={travaGeral}
            celulaCartelaStyle={celulaEstilo}
          />
        ))}
      </div>

      {/* Cartelas Salvas */}
      <div style={{ maxWidth: 950, margin: '0 auto' }}>
        <h3 style={styles.cardTitle}>CARTELAS SALVAS ({salvos.length})</h3>
        <div style={styles.gridSalvos}>
          {salvos.map((arr, idx) => (
            <div key={idx} style={styles.jogoSalvoGrade}>
              <div style={styles.badgeNumero}>Jogo #{salvos.length - idx}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                {(editandoIdx === idx ? cartelaEditTemp! : arr).map((linha, lIdx) => (
                  <div key={lIdx} style={{ display: 'flex', gap: 3 }}>
                    {linha.map((estado, nIdx) => {
                      const numero = lIdx * COLUNAS_QTD + nIdx + 1;
                      let bg = estado === 1 ? "#3b82f6" : estado === 2 ? "#ef4444" : "#f8fafc";
                      return (
                        <button 
                          key={nIdx}
                          disabled={editandoIdx !== idx}
                          onClick={() => alternarNumeroEdit(lIdx, nIdx)}
                          style={{ 
                            ...styles.celulaMini, 
                            background: bg, 
                            color: estado > 0 ? "#fff" : "#cbd5e1",
                            cursor: editandoIdx === idx ? 'pointer' : 'default'
                          }}
                        >
                          {(numero === 100 ? 0 : numero).toString().padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                {editandoIdx === idx ? (
                  <>
                    <button style={{ ...styles.btnAcao, background: '#16a34a', color: '#fff' }} onClick={() => {
                      const novos = salvos.map((c, i) => i === editandoIdx ? cartelaEditTemp! : c);
                      setSalvos(novos);
                      setEditandoIdx(null);
                    }}>OK</button>
                    <button style={styles.btnAcao} onClick={() => setEditandoIdx(null)}>Sair</button>
                  </>
                ) : (
                  <>
                    <button style={styles.btnAcao} onClick={() => { setEditandoIdx(idx); setCartelaEditTemp(arr.map(l => [...l])); }}>Editar</button>
                    <button style={{ ...styles.btnAcao, background: '#fee2e2', color: '#ef4444' }} onClick={() => {
                      setSalvos(prev => prev.filter((_, i) => i !== idx));
                    }}>Excluir</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#f1f5f9", minHeight: "100vh", fontFamily: "sans-serif", position: 'relative' as const },
  title: { fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 20, textAlign: 'center' as const },
  topoAcoesBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, maxWidth: 1300, margin: '0 auto 20px auto', flexWrap: 'wrap' as const, gap: 10 },
  btnVoltar: { background: '#e0e7ef', border: 'none', borderRadius: 8, padding: '10px 15px', fontWeight: 700, cursor: 'pointer', color: '#334155' },
  btnAcaoTopo: {
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease'
  },
  btnRaioX: {
    color: '#ffffff',
    border: '1px solid #0369a1',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
  },
  btnAdicionarCartelaFixa: {
    background: '#dbeafe',
    color: '#1d4ed8',
    border: '1px solid #93c5fd',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  btnNovoGabarito: {
    background: '#fef08a',
    color: '#854d0e',
    border: '1px solid #eab308',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  cardPrincipal: { background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", transition: 'all 0.2s ease' },
  cardTitle: { fontSize: 12, fontWeight: 800, color: "#64748b", margin: 0, textTransform: 'uppercase' as const },
  gradeSelecao: { display: 'flex', flexDirection: 'column' as const, gap: 4, alignItems: 'center' },
  celulaCartela: { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontWeight: 700, fontSize: 13 },
  celulaMini: { width: 20, height: 20, fontSize: 9, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSalvar: { width: '100%', padding: "8px", border: "none", borderRadius: 8, color: "white", fontWeight: "bold", marginTop: 8, cursor: 'pointer', fontSize: 12 },
  gridSalvos: { display: "flex", flexWrap: "wrap" as const, gap: 12, justifyContent: 'center' },
  jogoSalvoGrade: { background: "#fff", borderRadius: 12, padding: 10, border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  badgeNumero: { background: "#f1f5f9", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, marginBottom: 5 },
  btnAcao: { flex: 1, padding: '5px', fontSize: 10, fontWeight: 700, border: 'none', borderRadius: 4, cursor: 'pointer', background: '#f1f5f9' },
  gabaritoContainer: { position: 'fixed' as const, zIndex: 9999, background: 'transparent', borderRadius: 12, padding: '8px 8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', pointerEvents: 'none' as const },
  alcaGabarito: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'grab', background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', userSelect: 'none' as const, pointerEvents: 'auto' as const, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  badgeContadorGabarito: { fontSize: 11, fontWeight: 900, background: '#f1f5f9', padding: '1px 6px', borderRadius: 8, color: '#334155' },
  btnAcaoMini: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, cursor: 'pointer', padding: 0, color: '#475569' },

  janelaFlutuanteRaioX: {
    position: 'fixed' as const,
    zIndex: 9998,
    background: '#ffffff',
    borderRadius: 14,
    boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
    border: '2px solid #0284c7',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  alcaJanelaFlutuante: {
    background: '#f0f9ff',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab',
    borderBottom: '1px solid #bae6fd',
    userSelect: 'none' as const,
  },
  btnFecharFlutuante: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    width: 22,
    height: 22,
    borderRadius: 4,
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  corpoFlutuante: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    maxHeight: '75vh',
    overflowY: 'auto' as const
  },
  gridMapaCalorFlutuante: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 3,
    background: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  },
  celulaMapaFlutuante: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 1px',
    borderRadius: 4,
    border: '1px solid transparent',
  }
};