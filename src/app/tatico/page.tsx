"use client";

import React, { useState, useEffect, useRef } from "react";

// Grade com 5 números por linha: 01 a 99 e 00 (5 colunas x 20 linhas)
const COLUNAS_QTD = 5;
const LINHAS_QTD = 20;
const NUMS = Array.from({ length: COLUNAS_QTD }, (_, i) => i + 1);

const STORAGE_CARTELAS_KEY = "gerador_cartelas_5x20_salvas";
const STORAGE_GABARITOS_KEY = "gerador_gabaritos_5x20_transparentes";

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
        {Array.from({ length: LINHAS_QTD }, (_, linhaIdx) => (
          <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
            {NUMS.map(num => {
              const estado = selecionadas[linhaIdx][num - 1];
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
        style={{ ...styles.btnSalvar, background: "#16a34a" }}
        onClick={salvarCartela}
      >
        SALVAR CARTELA
      </button>
      {msg && <div style={{ color: '#16a34a', marginTop: 8, fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

export default function Gerador() {
  const [montado, setMontado] = useState(false);
  const [salvos, setSalvos] = useState<number[][][]>([]);
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [cartelaEditTemp, setCartelaEditTemp] = useState<number[][] | null>(null);
  
  const [selecionadas1, setSelecionadas1] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  const [selecionadas2, setSelecionadas2] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  const [selecionadas3, setSelecionadas3] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  const [selecionadas4, setSelecionadas4] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  
  const [fixos1, setFixos1] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  const [fixos2, setFixos2] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  const [fixos3, setFixos3] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));
  const [fixos4, setFixos4] = useState<number[][]>(() => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)));

  const [msg1, setMsg1] = useState("");
  const [msg2, setMsg2] = useState("");
  const [msg3, setMsg3] = useState("");
  const [msg4, setMsg4] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Estados dos gabaritos flutuantes (5x20)
  const [gabaritos, setGabaritos] = useState<Gabarito5x20[]>([]);

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_CARTELAS_KEY);
    if (s) setSalvos(JSON.parse(s));
    
    const f1 = localStorage.getItem("gerador_fixos1_20x5");
    if (f1) setFixos1(JSON.parse(f1));
    
    const f2 = localStorage.getItem("gerador_fixos2_20x5");
    if (f2) setFixos2(JSON.parse(f2));

    const f3 = localStorage.getItem("gerador_fixos3_20x5");
    if (f3) setFixos3(JSON.parse(f3));

    const f4 = localStorage.getItem("gerador_fixos4_20x5");
    if (f4) setFixos4(JSON.parse(f4));

    const gSalvos = localStorage.getItem(STORAGE_GABARITOS_KEY);
    if (gSalvos) setGabaritos(JSON.parse(gSalvos));
    
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    handleResize();
    window.addEventListener('resize', handleResize);
    setMontado(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (montado) {
      localStorage.setItem("gerador_fixos1_20x5", JSON.stringify(fixos1));
      localStorage.setItem("gerador_fixos2_20x5", JSON.stringify(fixos2));
      localStorage.setItem("gerador_fixos3_20x5", JSON.stringify(fixos3));
      localStorage.setItem("gerador_fixos4_20x5", JSON.stringify(fixos4));
    }
  }, [fixos1, fixos2, fixos3, fixos4, montado]);

  useEffect(() => {
    if (montado) {
      localStorage.setItem(STORAGE_GABARITOS_KEY, JSON.stringify(gabaritos));
    }
  }, [gabaritos, montado]);

  // Gestão de arrasto com o mouse
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

  const iniciarArrastoGabarito = (e: React.MouseEvent, gab: Gabarito5x20) => {
    arrastoRef.current = {
      id: gab.id,
      startX: e.clientX,
      startY: e.clientY,
      origemX: gab.x,
      origemY: gab.y,
    };
  };

  const adicionarGabarito = () => {
    const novo: Gabarito5x20 = {
      id: Date.now(),
      x: 120 + (gabaritos.length % 4) * 30,
      y: 90 + (gabaritos.length % 4) * 30,
      valores: Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)),
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
          ? { ...gab, valores: Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0)) }
          : gab
      )
    );
  };

  const excluirGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) => anteriores.filter((gab) => gab.id !== idGabarito));
  };

  const alternarNumeroGenerico = (linhaIdx: number, num: number, setSelecionadas: any, setFixos: any) => {
    const idx = num - 1;
    setSelecionadas((prev: number[][]) => prev.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const novoArr = [...linha];
      novoArr[idx] = (novoArr[idx] + 1) % 3;
      
      setFixos((f: number[][]) => f.map((lFixo, j) => 
        j === linhaIdx ? lFixo.map((v, k) => (k === idx ? (novoArr[idx] === 2 ? 1 : 0) : v)) : lFixo
      ));
      
      return novoArr;
    }));
  };

  const salvarCartelaGenerica = (selecionadas: number[][], fixos: number[][], setSelecionadas: any, setMsg: any) => {
    const jaSalvo = salvos.some(s => JSON.stringify(s) === JSON.stringify(selecionadas));
    if (jaSalvo) return setMsg("⚠️ Cartela já foi salva!");

    const novosSalvos = [selecionadas, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novosSalvos));
    setMsg("Cartela salva!");
    
    setSelecionadas(fixos.map(linha => linha.map(v => (v === 1 ? 2 : 0))));
  };

  const alternarNumeroEdit = (linhaIdx: number, idx2: number) => {
    setCartelaEditTemp(prev => prev!.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const novoArr = [...linha];
      novoArr[idx2] = (novoArr[idx2] + 1) % 3;
      return novoArr;
    }));
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
      {/* Camada das Cartelas Gabarito Transparentes Flutuantes (5 colunas x 20 linhas) */}
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
              border: `2px dashed ${cor.borda}`, // Moldura visível tracejada
            }}
          >
            {/* Alça de Arraste Superior */}
            <div
              onMouseDown={(e) => iniciarArrastoGabarito(e, gab)}
              style={styles.alcaGabarito}
              title="Clique e arraste para movimentar este gabarito sobre qualquer cartela"
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

            {/* Grade 5x20 Transparente */}
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

      <div style={styles.topoAcoesBar}>
        <button style={styles.btnVoltar} onClick={() => window.location.href = '/'}>
          ⬅ Voltar para Painel
        </button>

        <button
          type="button"
          style={styles.btnNovoGabarito}
          onClick={adicionarGabarito}
        >
          📋 + Cartela Gabarito {gabaritos.length > 0 && `(${gabaritos.length})`}
        </button>
      </div>

      <h1 style={styles.title}>GERADOR TÁTICO 5x20</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
        gap: isMobile ? 14 : 8,
        maxWidth: 900,
        margin: '0 auto',
        marginBottom: 30 
      }}>
        <CartaoMontarJogo 
          selecionadas={selecionadas1} 
          alternarNumero={(l: number, n: number) => { setMsg1(""); alternarNumeroGenerico(l, n, setSelecionadas1, setFixos1); }}
          salvarCartela={() => salvarCartelaGenerica(selecionadas1, fixos1, setSelecionadas1, setMsg1)}
          msg={msg1}
          celulaCartelaStyle={celulaEstilo}
        />
        <CartaoMontarJogo 
          selecionadas={selecionadas2} 
          alternarNumero={(l: number, n: number) => { setMsg2(""); alternarNumeroGenerico(l, n, setSelecionadas2, setFixos2); }}
          salvarCartela={() => salvarCartelaGenerica(selecionadas2, fixos2, setSelecionadas2, setMsg2)}
          msg={msg2}
          celulaCartelaStyle={celulaEstilo}
        />
        <CartaoMontarJogo 
          selecionadas={selecionadas3} 
          alternarNumero={(l: number, n: number) => { setMsg3(""); alternarNumeroGenerico(l, n, setSelecionadas3, setFixos3); }}
          salvarCartela={() => salvarCartelaGenerica(selecionadas3, fixos3, setSelecionadas3, setMsg3)}
          msg={msg3}
          celulaCartelaStyle={celulaEstilo}
        />
        <CartaoMontarJogo 
          selecionadas={selecionadas4} 
          alternarNumero={(l: number, n: number) => { setMsg4(""); alternarNumeroGenerico(l, n, setSelecionadas4, setFixos4); }}
          salvarCartela={() => salvarCartelaGenerica(selecionadas4, fixos4, setSelecionadas4, setMsg4)}
          msg={msg4}
          celulaCartelaStyle={celulaEstilo}
        />
      </div>

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
                      localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novos));
                      setEditandoIdx(null);
                    }}>OK</button>
                    <button style={styles.btnAcao} onClick={() => setEditandoIdx(null)}>Sair</button>
                  </>
                ) : (
                  <>
                    <button style={styles.btnAcao} onClick={() => { setEditandoIdx(idx); setCartelaEditTemp(arr.map(l => [...l])); }}>Editar</button>
                    <button style={{ ...styles.btnAcao, background: '#fee2e2', color: '#ef4444' }} onClick={() => {
                      const novos = salvos.filter((_, i) => i !== idx);
                      setSalvos(novos);
                      localStorage.setItem(STORAGE_CARTELAS_KEY, JSON.stringify(novos));
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
  topoAcoesBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, maxWidth: 900, margin: '0 auto 15px auto', flexWrap: 'wrap' as const, gap: 10 },
  btnVoltar: { background: '#e0e7ef', border: 'none', borderRadius: 8, padding: '10px 15px', fontWeight: 700, cursor: 'pointer', color: '#334155' },
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
  cardPrincipal: { background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: 'uppercase' as const },
  gradeSelecao: { display: 'flex', flexDirection: 'column' as const, gap: 4, alignItems: 'center' },
  celulaCartela: { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontWeight: 700, fontSize: 13 },
  celulaMini: { width: 20, height: 20, fontSize: 9, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSalvar: { width: '100%', padding: "12px", border: "none", borderRadius: 8, color: "white", fontWeight: "bold", marginTop: 10, cursor: 'pointer' },
  gridSalvos: { display: "flex", flexWrap: "wrap" as const, gap: 12, justifyContent: 'center' },
  jogoSalvoGrade: { background: "#fff", borderRadius: 12, padding: 10, border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  badgeNumero: { background: "#f1f5f9", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, marginBottom: 5 },
  btnAcao: { flex: 1, padding: '5px', fontSize: 10, fontWeight: 700, border: 'none', borderRadius: 4, cursor: 'pointer', background: '#f1f5f9' },
  // Estilos da Cartela Gabarito Flutuante (5x20)
  gabaritoContainer: {
    position: 'fixed' as const,
    zIndex: 9999,
    background: 'transparent',
    borderRadius: 12,
    padding: '8px 8px',
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