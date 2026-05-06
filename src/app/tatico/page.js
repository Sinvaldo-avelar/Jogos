"use client";

import { useState, useEffect } from "react";

// Configurações da nova grade: 9 colunas por 7 linhas
const COLUNAS_QTD = 9; 
const LINHAS_QTD = 7;
const NUMS = Array.from({ length: COLUNAS_QTD }, (_, i) => i + 1);

// Componente para o cartão de montar jogo
function CartaoMontarJogo({ selecionadas, alternarNumero, salvarCartela, msg, cardPrincipalStyle, celulaCartelaStyle, gradeSelecaoStyle }) {
  const totalEscolhidos = selecionadas.reduce(
    (acc, linha) => acc + linha.filter(v => v === 1 || v === 2).length,
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
                  {num.toString().padStart(2, "0")}
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
  const [salvos, setSalvos] = useState([]);
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [cartelaEditTemp, setCartelaEditTemp] = useState(null);
  
  // Estados das duas áreas de montagem
  const [selecionadas1, setSelecionadas1] = useState(() => Array(LINHAS_QTD).fill().map(() => Array(COLUNAS_QTD).fill(0)));
  const [selecionadas2, setSelecionadas2] = useState(() => Array(LINHAS_QTD).fill().map(() => Array(COLUNAS_QTD).fill(0)));
  
  const [fixos1, setFixos1] = useState(() => Array(LINHAS_QTD).fill().map(() => Array(COLUNAS_QTD).fill(0)));
  const [fixos2, setFixos2] = useState(() => Array(LINHAS_QTD).fill().map(() => Array(COLUNAS_QTD).fill(0)));

  const [msg1, setMsg1] = useState("");
  const [msg2, setMsg2] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("gerador_cartelas_9x7");
    if (s) setSalvos(JSON.parse(s));
    
    const f1 = localStorage.getItem("gerador_fixos1_9x7");
    if (f1) setFixos1(JSON.parse(f1));
    
    const f2 = localStorage.getItem("gerador_fixos2_9x7");
    if (f2) setFixos2(JSON.parse(f2));
    
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    handleResize();
    window.addEventListener('resize', handleResize);
    setMontado(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (montado) {
      localStorage.setItem("gerador_fixos1_9x7", JSON.stringify(fixos1));
      localStorage.setItem("gerador_fixos2_9x7", JSON.stringify(fixos2));
    }
  }, [fixos1, fixos2, montado]);

  const alternarNumeroGenerico = (linhaIdx, num, setSelecionadas, setFixos) => {
    const idx = num - 1;
    setSelecionadas(prev => prev.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const novoArr = [...linha];
      novoArr[idx] = (novoArr[idx] + 1) % 3;
      
      setFixos(f => f.map((lFixo, j) => 
        j === linhaIdx ? lFixo.map((v, k) => (k === idx ? (novoArr[idx] === 2 ? 1 : 0) : v)) : lFixo
      ));
      
      return novoArr;
    }));
  };

  const salvarCartelaGenerica = (selecionadas, fixos, setSelecionadas, setMsg) => {
    const jaSalvo = salvos.some(s => JSON.stringify(s) === JSON.stringify(selecionadas));
    if (jaSalvo) return setMsg("⚠️ Cartela já foi salva!");

    const novosSalvos = [selecionadas, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem("gerador_cartelas_9x7", JSON.stringify(novosSalvos));
    setMsg("Cartela salva!");
    
    // Restaura mantendo os vermelhos (fixos)
    setSelecionadas(fixos.map(linha => linha.map(v => (v === 1 ? 2 : 0))));
  };

  const alternarNumeroEdit = (linhaIdx, idx2) => {
    setCartelaEditTemp(prev => prev.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const novoArr = [...linha];
      novoArr[idx2] = (novoArr[idx2] + 1) % 3;
      return novoArr;
    }));
  };

  if (!montado) return null;

  return (
    <div style={{ ...styles.container, padding: isMobile ? '10px' : '40px 20px' }}>
      <button style={styles.btnVoltar} onClick={() => window.location.href = '/'}>
        ⬅ Voltar para Painel
      </button>
      <h1 style={styles.title}>GERADOR 9x7 LOTOMANIA</h1>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: 20, 
        justifyContent: 'center',
        marginBottom: 30 
      }}>
        <CartaoMontarJogo 
          selecionadas={selecionadas1} 
          alternarNumero={(l, n) => { setMsg1(""); alternarNumeroGenerico(l, n, setSelecionadas1, setFixos1); }}
          salvarCartela={() => salvarCartelaGenerica(selecionadas1, fixos1, setSelecionadas1, setMsg1)}
          msg={msg1}
          celulaCartelaStyle={{ ...styles.celulaCartela, width: isMobile ? 26 : 32, height: isMobile ? 26 : 32 }}
        />
        <CartaoMontarJogo 
          selecionadas={selecionadas2} 
          alternarNumero={(l, n) => { setMsg2(""); alternarNumeroGenerico(l, n, setSelecionadas2, setFixos2); }}
          salvarCartela={() => salvarCartelaGenerica(selecionadas2, fixos2, setSelecionadas2, setMsg2)}
          msg={msg2}
          celulaCartelaStyle={{ ...styles.celulaCartela, width: isMobile ? 26 : 32, height: isMobile ? 26 : 32 }}
        />
      </div>

      <div style={{ maxWidth: 950, margin: '0 auto' }}>
        <h3 style={styles.cardTitle}>CARTELAS SALVAS ({salvos.length})</h3>
        <div style={styles.gridSalvos}>
          {salvos.map((arr, idx) => (
            <div key={idx} style={styles.jogoSalvoGrade}>
              <div style={styles.badgeNumero}>Jogo #{salvos.length - idx}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                {(editandoIdx === idx ? cartelaEditTemp : arr).map((linha, lIdx) => (
                  <div key={lIdx} style={{ display: 'flex', gap: 3 }}>
                    {linha.map((estado, nIdx) => {
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
                          {(nIdx + 1).toString().padStart(2, "0")}
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
                      const novos = salvos.map((c, i) => i === editandoIdx ? cartelaEditTemp : c);
                      setSalvos(novos);
                      localStorage.setItem("gerador_cartelas_9x7", JSON.stringify(novos));
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
                      localStorage.setItem("gerador_cartelas_9x7", JSON.stringify(novos));
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
  container: { background: "#f1f5f9", minHeight: "100vh", fontFamily: "sans-serif" },
  title: { fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 20, textAlign: 'center' },
  btnVoltar: { marginBottom: 15, background: '#e0e7ef', border: 'none', borderRadius: 8, padding: '10px 15px', fontWeight: 700, cursor: 'pointer' },
  cardPrincipal: { background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: 'uppercase' },
  gradeSelecao: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  celulaCartela: { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontWeight: 700, fontSize: 13 },
  celulaMini: { width: 20, height: 20, fontSize: 9, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSalvar: { width: '100%', padding: "12px", border: "none", borderRadius: 8, color: "white", fontWeight: "bold", marginTop: 10, cursor: 'pointer' },
  gridSalvos: { display: "flex", flexWrap: "wrap", gap: 12, justifyContent: 'center' },
  jogoSalvoGrade: { background: "#fff", borderRadius: 12, padding: 10, border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column', alignItems: 'center' },
  badgeNumero: { background: "#f1f5f9", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, marginBottom: 5 },
  btnAcao: { flex: 1, padding: '5px', fontSize: 10, fontWeight: 700, border: 'none', borderRadius: 4, cursor: 'pointer', background: '#f1f5f9' }
};