"use client";

import React, { useState, useEffect, useRef } from "react";

const COLUNAS = 10;
const NUMS = Array.from({ length: 10 }, (_, i) => i + 1);

const STORAGE_CARTELAS_KEY = "gerador_cartelas";
const STORAGE_GABARITOS_KEY = "gerador_gabaritos_transparentes";

const CORES_GABARITO = [
  { solido: '#dc2626', borda: '#991b1b', nome: 'Vermelho' },
  { solido: '#16a34a', borda: '#15803d', nome: 'Verde' },
  { solido: '#9333ea', borda: '#7e22ce', nome: 'Roxo' },
  { solido: '#ea580c', borda: '#c2410c', nome: 'Laranja' },
];

interface GabaritoLotomania {
  id: number;
  x: number;
  y: number;
  valores: number[][];
  corIdx: number;
}

// Componente para o cartão de montar jogo
function CartaoMontarJogo({ selecionadas, alternarNumero, salvarCartela, msg, cardPrincipalStyle, celulaCartelaStyle, gradeSelecaoStyle }: any) {
  const totalEscolhidos = selecionadas.reduce(
    (acc: number, linha: number[]) => acc + linha.filter(v => v === 1 || v === 2).length,
    0
  );
  return (
    <div style={cardPrincipalStyle || styles.cardPrincipal}>
      <h3 style={styles.cardTitle}>MONTAR NOVO JOGO</h3>
      <div style={{ marginBottom: 8, fontWeight: 600, color: '#0f172a', fontSize: 15 }}>
        Números escolhidos: {totalEscolhidos}
      </div>
      <div style={gradeSelecaoStyle || styles.gradeSelecao}>
        {Array.from({ length: COLUNAS }, (_, linhaIdx) => (
          <div key={linhaIdx} style={{ display: 'flex', gap: (celulaCartelaStyle && celulaCartelaStyle.width === 22) ? 2 : 4 }}>
            {NUMS.map(num => {
              const numero = linhaIdx * NUMS.length + num;
              const estado = selecionadas[linhaIdx][num - 1];
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
                  style={{
                    ...(celulaCartelaStyle || styles.celulaCartela),
                    background,
                    color,
                    border,
                    cursor: "pointer",
                  }}
                  onClick={() => alternarNumero(linhaIdx, num)}
                >
                  {(numero === 100 ? 0 : numero).toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <button
        style={{
          ...styles.btnSalvar,
          background: "#16a34a",
          cursor: "pointer",
        }}
        onClick={salvarCartela}
      >
        SALVAR CARTELA
      </button>
      {msg && <div style={{ color: '#16a34a', marginTop: 8, fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

export default function Gerador() {
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [cartelaEditTemp, setCartelaEditTemp] = useState<number[][] | null>(null);

  const alternarNumeroEdit = (linhaIdx: number, num: number) => {
    if (!cartelaEditTemp) return;
    setCartelaEditTemp(prev => prev!.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const idx = num - 1;
      const novoArr = [...linha];
      novoArr[idx] = (novoArr[idx] + 1) % 3;
      return novoArr;
    }));
  };

  const salvarEdicaoCartela = () => {
    if (editandoIdx === null || !cartelaEditTemp) return;
    const novos = salvos.map((c, i) => i === editandoIdx ? cartelaEditTemp : c);
    setSalvos(novos);
    localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novos));
    setEditandoIdx(null);
    setCartelaEditTemp(null);
  };

  const cancelarEdicaoCartela = () => {
    setEditandoIdx(null);
    setCartelaEditTemp(null);
  };

  const [selecionadas1, setSelecionadas1] = useState<number[][]>(() => Array(COLUNAS).fill(0).map(() => Array(NUMS.length).fill(0)));
  const [selecionadas2, setSelecionadas2] = useState<number[][]>(() => Array(COLUNAS).fill(0).map(() => Array(NUMS.length).fill(0)));
  const [fixos1, setFixos1] = useState<number[][]>(() => Array(COLUNAS).fill(0).map(() => Array(NUMS.length).fill(0)));
  const [fixos2, setFixos2] = useState<number[][]>(() => Array(COLUNAS).fill(0).map(() => Array(NUMS.length).fill(0)));
  const [salvos, setSalvos] = useState<number[][][]>([]);
  const [msg1, setMsg1] = useState("");
  const [msg2, setMsg2] = useState("");
  const [montado, setMontado] = useState(false);

  // Estados dos Gabaritos Flutuantes
  const [gabaritos, setGabaritos] = useState<GabaritoLotomania[]>([]);

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_CARTELAS_KEY);
    if (s) setSalvos(JSON.parse(s));
    const f1 = localStorage.getItem("gerador_fixos1");
    if (f1) setFixos1(JSON.parse(f1));
    const f2 = localStorage.getItem("gerador_fixos2");
    if (f2) setFixos2(JSON.parse(f2));

    const gSalvos = localStorage.getItem(STORAGE_GABARITOS_KEY);
    if (gSalvos) setGabaritos(JSON.parse(gSalvos));

    setMontado(true);
  }, []);

  useEffect(() => {
    if (montado) localStorage.setItem("gerador_fixos1", JSON.stringify(fixos1));
  }, [fixos1, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem("gerador_fixos2", JSON.stringify(fixos2));
  }, [fixos2, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_GABARITOS_KEY, JSON.stringify(gabaritos));
  }, [gabaritos, montado]);

  // Gestão de arrasto dos gabaritos com mouse
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

  const iniciarArrastoGabarito = (e: React.MouseEvent, gab: GabaritoLotomania) => {
    arrastoRef.current = {
      id: gab.id,
      startX: e.clientX,
      startY: e.clientY,
      origemX: gab.x,
      origemY: gab.y,
    };
  };

  const adicionarGabarito = () => {
    const novo: GabaritoLotomania = {
      id: Date.now(),
      x: 140 + (gabaritos.length % 4) * 25,
      y: 110 + (gabaritos.length % 4) * 35,
      valores: Array(COLUNAS).fill(0).map(() => Array(NUMS.length).fill(0)),
      corIdx: gabaritos.length % CORES_GABARITO.length,
    };
    setGabaritos((anteriores) => [...anteriores, novo]);
  };

  const alternarNumeroGabarito = (idGabarito: number, linhaIdx: number, numIdx: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) => {
        if (gab.id !== idGabarito) return gab;
        const novosValores = gab.valores.map((linha, lIdx) =>
          lIdx === linhaIdx
            ? linha.map((val, nIdx) => (nIdx === numIdx ? (val === 0 ? 1 : 0) : val))
            : [...linha]
        );
        return { ...gab, valores: novosValores };
      })
    );
  };

  const limparGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) =>
        gab.id === idGabarito
          ? { ...gab, valores: Array(COLUNAS).fill(0).map(() => Array(NUMS.length).fill(0)) }
          : gab
      )
    );
  };

  const excluirGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) => anteriores.filter((gab) => gab.id !== idGabarito));
  };

  const alternarNumero1 = (colIdx: number, num: number) => {
    setMsg1("");
    if (num < 1 || num > 10) return;
    setSelecionadas1(sel => {
      return sel.map((arr, i) => {
        if (i !== colIdx) return arr;
        const idx = num - 1;
        const novoArr = [...arr];
        novoArr[idx] = (novoArr[idx] + 1) % 3;
        setFixos1(fixos => {
          const novoFixos = fixos.map((linha, j) =>
            j === colIdx ? linha.map((v, k) => (k === idx ? (novoArr[idx] === 2 ? 1 : 0) : v)) : linha
          );
          return novoFixos;
        });
        return novoArr;
      });
    });
  };

  const alternarNumero2 = (colIdx: number, num: number) => {
    setMsg2("");
    if (num < 1 || num > 10) return;
    setSelecionadas2(sel => {
      return sel.map((arr, i) => {
        if (i !== colIdx) return arr;
        const idx = num - 1;
        const novoArr = [...arr];
        novoArr[idx] = (novoArr[idx] + 1) % 3;
        setFixos2(fixos => {
          const novoFixos = fixos.map((linha, j) =>
            j === colIdx ? linha.map((v, k) => (k === idx ? (novoArr[idx] === 2 ? 1 : 0) : v)) : linha
          );
          return novoFixos;
        });
        return novoArr;
      });
    });
  };

  const restaurarFixos = (fixos: number[][]) => fixos.map(linha => linha.map(v => (v === 1 ? 2 : 0)));

  const salvarCartela1 = () => {
    const cartela = selecionadas1.map(arr => [...arr]);
    const jaSalvo = salvos.some(salvo => JSON.stringify(salvo) === JSON.stringify(cartela));
    if (jaSalvo) {
      setMsg1("⚠️ Cartela já foi salva!");
      return;
    }
    const novosSalvos = [cartela, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novosSalvos));
    setMsg1("Cartela salva!");
    setSelecionadas1(restaurarFixos(fixos1));
  };

  const salvarCartela2 = () => {
    const cartela = selecionadas2.map(arr => [...arr]);
    const jaSalvo = salvos.some(salvo => JSON.stringify(salvo) === JSON.stringify(cartela));
    if (jaSalvo) {
      setMsg2("⚠️ Cartela já foi salva!");
      return;
    }
    const novosSalvos = [cartela, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novosSalvos));
    setMsg2("Cartela salva!");
    setSelecionadas2(restaurarFixos(fixos2));
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!montado) return null;

  const cardPrincipalStyle = {
    ...styles.cardPrincipal,
    maxWidth: isMobile ? '100%' : 420,
    width: isMobile ? '100%' : undefined,
    padding: isMobile ? 10 : 24,
    margin: isMobile ? '0 auto' : undefined,
    boxSizing: 'border-box' as const,
  };
  const celulaCartelaStyle = {
    ...styles.celulaCartela,
    width: isMobile ? 22 : 32,
    height: isMobile ? 22 : 32,
    fontSize: isMobile ? 11 : 14,
    borderRadius: 6,
    margin: 0,
    padding: 0,
  };
  const gradeSelecaoStyle = {
    ...styles.gradeSelecao,
    gap: isMobile ? 2 : 8,
    marginBottom: isMobile ? 6 : 16,
  };
  const jogoSalvoGradeStyle = {
    ...styles.jogoSalvoGrade,
    width: isMobile ? '100%' : 'fit-content',
    minWidth: isMobile ? 0 : undefined,
    padding: isMobile ? 6 : 12,
  };

  return (
    <div style={{ ...styles.container, padding: isMobile ? '8px 2px' : '40px 20px' }}>
      {/* Camada das Cartelas Gabarito Flutuantes Transparentes (Grade 10x10) */}
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
              border: `2px dashed ${cor.borda}`, // Moldura visível externa
            }}
          >
            {/* Alça de Arraste Lateral */}
            <div
              onMouseDown={(e) => iniciarArrastoGabarito(e, gab)}
              style={styles.alcaGabarito}
              title="Clique e arraste para movimentar este gabarito transparente sobre qualquer cartela"
            >
              <span style={{ fontSize: 11, fontWeight: 900, color: cor.borda }}>G{idx + 1}</span>
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

            {/* Grade 10x10 Transparente */}
            <div style={{ ...gradeSelecaoStyle, marginBottom: 0, pointerEvents: 'none' }}>
              {Array.from({ length: COLUNAS }, (_, linhaIdx) => (
                <div
                  key={linhaIdx}
                  style={{
                    display: 'flex',
                    gap: (celulaCartelaStyle && celulaCartelaStyle.width === 22) ? 2 : 4,
                  }}
                >
                  {NUMS.map((num, numIdx) => {
                    const numero = linhaIdx * NUMS.length + num;
                    const ativo = gab.valores[linhaIdx][numIdx] === 1;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => alternarNumeroGabarito(gab.id, linhaIdx, numIdx)}
                        style={{
                          ...celulaCartelaStyle,
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

      <div style={styles.topoAcoesBar}>
        <button
          style={{
            background: '#e0e7ef',
            color: '#334155',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 2px 6px -2px #cbd5e1',
          }}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
        >
          ⬅ Voltar para Painel de Jogos
        </button>

        <button
          type="button"
          style={styles.btnNovoGabarito}
          onClick={adicionarGabarito}
        >
          📋 + Cartela Gabarito {gabaritos.length > 0 && `(${gabaritos.length})`}
        </button>
      </div>

      <h1 style={styles.title}>GERADOR DE CARTELA LOTOMANIA</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 6 : 32,
          marginBottom: 24,
          justifyContent: 'center',
          alignItems: isMobile ? 'stretch' : 'center',
          width: '100%',
        }}
      >
        <CartaoMontarJogo
          selecionadas={selecionadas1}
          alternarNumero={alternarNumero1}
          salvarCartela={salvarCartela1}
          msg={msg1}
          cardPrincipalStyle={cardPrincipalStyle}
          celulaCartelaStyle={celulaCartelaStyle}
          gradeSelecaoStyle={gradeSelecaoStyle}
        />
        <CartaoMontarJogo
          selecionadas={selecionadas2}
          alternarNumero={alternarNumero2}
          salvarCartela={salvarCartela2}
          msg={msg2}
          cardPrincipalStyle={cardPrincipalStyle}
          celulaCartelaStyle={celulaCartelaStyle}
          gradeSelecaoStyle={gradeSelecaoStyle}
        />
      </div>

      <div style={{ ...styles.colunaDireita, maxWidth: 900, margin: '0 auto' }}>
        <h3 style={styles.cardTitle}>CARTELAS SALVAS ({salvos.length})</h3>
        <div style={styles.gridSalvos}>
          {salvos.map((arr, idx) => (
            <div key={idx} style={jogoSalvoGradeStyle}>
              <div style={styles.badgeNumero}>Jogo #{salvos.length - idx}</div>
              {editandoIdx === idx ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {cartelaEditTemp!.map((linha, linhaIdx) => (
                      <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
                        {linha.map((estado, idx2) => {
                          const numero = linhaIdx * NUMS.length + idx2 + 1;
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
                              key={idx2}
                              style={{ ...styles.celulaCartela, width: 22, height: 22, fontSize: 10, background, color, border, cursor: 'pointer' }}
                              onClick={() => alternarNumeroEdit(linhaIdx, idx2 + 1)}
                            >
                              {(numero === 100 ? 0 : numero).toString().padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <button style={{ ...styles.btnSalvar, background: '#16a34a', fontSize: 11, padding: 6 }} onClick={salvarEdicaoCartela}>Salvar</button>
                    <button style={{ ...styles.btnExcluir, fontSize: 11, padding: 6 }} onClick={cancelarEdicaoCartela}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {arr.map((linha, linhaIdx) => (
                      <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
                        {linha.map((estado, idx2) => {
                          const numero = linhaIdx * NUMS.length + idx2 + 1;
                          let background = "#f8fafc";
                          let color = "#cbd5e1";
                          let border = "1px solid #f1f5f9";
                          if (estado === 1) {
                            background = "#3b82f6";
                            color = "#fff";
                            border = "1px solid #2563eb";
                          } else if (estado === 2) {
                            background = "#ef4444";
                            color = "#fff";
                            border = "1px solid #b91c1c";
                          }
                          return (
                            <span
                              key={idx2}
                              style={{ ...styles.celulaCartela, width: 22, height: 22, fontSize: 10, background, color, border }}
                            >
                              {(numero === 100 ? 0 : numero).toString().padStart(2, "0")}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <button
                      style={{ ...styles.btnExcluir, background: '#e0e7ef', color: '#2563eb', border: 'none', fontSize: 11 }}
                      onClick={() => { setEditandoIdx(idx); setCartelaEditTemp(arr.map(l => [...l])); }}
                      title="Editar inline"
                    >
                      Editar
                    </button>
                    <button
                      style={styles.btnExcluir}
                      onClick={() => {
                        const novos = salvos.filter((_, i2) => i2 !== idx);
                        setSalvos(novos);
                        localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novos));
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#f1f5f9", minHeight: "100vh", padding: "40px 20px", fontFamily: "sans-serif", position: 'relative' as const },
  title: { fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 10, textAlign: 'left' as const },
  topoAcoesBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' as const, gap: 10 },
  btnNovoGabarito: {
    background: '#fef08a',
    color: '#854d0e',
    border: '1px solid #eab308',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  cardPrincipal: { 
    background: "#fff", 
    padding: 24, 
    borderRadius: 16, 
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
  },
  badgeNumero: {
    background: "#f1f5f9",
    color: "#475569",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: 20,
    marginBottom: 8,
    border: "1px solid #e2e8f0"
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 16, textTransform: 'uppercase' as const },
  colunaDireita: { flex: 1 },
  gridSalvos: { 
    display: "flex", 
    flexWrap: "wrap" as const, 
    gap: 16, 
    maxHeight: 420, 
    overflowY: "auto" as const, 
    paddingRight: 4, 
  },
  jogoSalvoGrade: { 
    background: "#fff", 
    borderRadius: 12, 
    padding: 12, 
    display: "flex", 
    flexDirection: "column" as const, 
    alignItems: "center", 
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    width: "fit-content",
  },
  gradeSelecao: { display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16, alignItems: 'center' },
  celulaCartela: { 
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", 
    borderRadius: 6, fontWeight: 700, fontSize: 14, border: "none" 
  },
  btnSalvar: { 
    width: '100%', padding: "12px", border: "none", borderRadius: 8, color: "white", 
    fontWeight: "bold", fontSize: 14, marginTop: 10, cursor: 'pointer' 
  },
  btnExcluir: {
    width: '100%', background: "#fee2e2", color: "#ef4444", border: "none", 
    borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const
  },
  // Estilos da Cartela Gabarito Flutuante para Lotomania (Grade 10x10)
  gabaritoContainer: {
    position: 'fixed' as const,
    zIndex: 9999,
    background: 'transparent',
    borderRadius: 12,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    pointerEvents: 'none' as const,
  },
  alcaGabarito: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: 'grab',
    background: '#ffffff',
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    userSelect: 'none' as const,
    pointerEvents: 'auto' as const,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  badgeContadorGabarito: {
    fontSize: 11,
    fontWeight: 900,
    background: '#f1f5f9',
    padding: '1px 6px',
    borderRadius: 8,
    color: '#334155',
  },
  btnAcaoMini: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    width: 18,
    height: 18,
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