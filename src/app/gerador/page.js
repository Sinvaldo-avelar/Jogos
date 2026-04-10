"use client";

import { useState, useEffect } from "react";

const COLUNAS = 10;
const NUMS = Array.from({ length: 10 }, (_, i) => i + 1);


// Componente para o cartão de montar jogo
function CartaoMontarJogo({ selecionadas, alternarNumero, salvarCartela, msg }) {
  return (
    <div style={styles.cardPrincipal}>
      <h3 style={styles.cardTitle}>MONTAR NOVO JOGO</h3>
      <div style={styles.gradeSelecao}>
        {Array.from({ length: COLUNAS }, (_, linhaIdx) => (
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
                    ...styles.celulaCartela,
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
  // 0: normal, 1: azul, 2: vermelho
  const [selecionadas1, setSelecionadas1] = useState(() => Array(COLUNAS).fill().map(() => Array(NUMS.length).fill(0)));
  const [selecionadas2, setSelecionadas2] = useState(() => Array(COLUNAS).fill().map(() => Array(NUMS.length).fill(0)));
  const [salvos, setSalvos] = useState([]);
  const [msg1, setMsg1] = useState("");
  const [msg2, setMsg2] = useState("");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("gerador_cartelas");
    if (s) setSalvos(JSON.parse(s));
    setMontado(true);
  }, []);

  const alternarNumero1 = (colIdx, num) => {
    setMsg1("");
    if (num < 1 || num > 10) return;
    setSelecionadas1(sel => {
      return sel.map((arr, i) => {
        if (i !== colIdx) return arr;
        const idx = num - 1;
        const novoArr = [...arr];
        novoArr[idx] = (novoArr[idx] + 1) % 3;
        return novoArr;
      });
    });
  };
  const alternarNumero2 = (colIdx, num) => {
    setMsg2("");
    if (num < 1 || num > 10) return;
    setSelecionadas2(sel => {
      return sel.map((arr, i) => {
        if (i !== colIdx) return arr;
        const idx = num - 1;
        const novoArr = [...arr];
        novoArr[idx] = (novoArr[idx] + 1) % 3;
        return novoArr;
      });
    });
  };

  const salvarCartela1 = () => {
    const cartela = selecionadas1.map(arr => [...arr]);
    const jaSalvo = salvos.some(salvo => JSON.stringify(salvo) === JSON.stringify(cartela));
    if (jaSalvo) {
      setMsg1("⚠️ Cartela já foi salva!");
      return;
    }
    const novosSalvos = [cartela, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem("gerador_cartelas", JSON.stringify(novosSalvos));
    setMsg1("Cartela salva!");
    setSelecionadas1(Array(COLUNAS).fill().map(() => Array(NUMS.length).fill(0)));
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
    localStorage.setItem("gerador_cartelas", JSON.stringify(novosSalvos));
    setMsg2("Cartela salva!");
    setSelecionadas2(Array(COLUNAS).fill().map(() => Array(NUMS.length).fill(0)));
  };

  if (!montado) return null;

  return (
    <div style={styles.container}>
      <button
        style={{
          marginBottom: 18,
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
      <h1 style={styles.title}>GERADOR DE CARTELA LOTOMANIA</h1>

      <div style={{ display: 'flex', gap: 32, marginBottom: 32, justifyContent: 'center' }}>
        <CartaoMontarJogo
          selecionadas={selecionadas1}
          alternarNumero={alternarNumero1}
          salvarCartela={salvarCartela1}
          msg={msg1}
        />
        <CartaoMontarJogo
          selecionadas={selecionadas2}
          alternarNumero={alternarNumero2}
          salvarCartela={salvarCartela2}
          msg={msg2}
        />
      </div>

      <div style={{ ...styles.colunaDireita, maxWidth: 900, margin: '0 auto' }}>
        <h3 style={styles.cardTitle}>CARTELAS SALVAS ({salvos.length})</h3>
        <div style={styles.gridSalvos}>
          {salvos.map((arr, idx) => (
            <div key={idx} style={styles.jogoSalvoGrade}>
              <div style={styles.badgeNumero}>Jogo #{salvos.length - idx}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {arr.map((linha, linhaIdx) => (
                  <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
                    {linha.map((estado, idx2) => {
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
                          style={{
                            ...styles.celulaCartela,
                            width: 22,
                            height: 22,
                            fontSize: 10,
                            background,
                            color,
                            border,
                          }}
                        >
                          {(idx2 + 1).toString().padStart(2, "0")}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
              <button
                style={styles.btnExcluir}
                onClick={() => {
                  const novos = salvos.filter((_, i2) => i2 !== idx);
                  setSalvos(novos);
                  localStorage.setItem("gerador_cartelas", JSON.stringify(novos));
                }}
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#f1f5f9", minHeight: "100vh", padding: "40px 20px", fontFamily: "sans-serif" },
  title: { fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 10, textAlign: 'left' },
  msgFeedback: { marginBottom: 15, color: "#16a34a", fontWeight: 600, height: '24px' },
  
  layoutPrincipal: { 
    display: "flex", 
    flexDirection: "row", // Garante lado a lado
    alignItems: "flex-start", 
    gap: 40 
  },
  
  colunaEsquerda: {
    flexShrink: 0, // Não deixa a coluna da esquerda encolher
  },
  
  colunaDireita: {
    flex: 1, // Ocupa o resto do espaço
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

  cardTitle: { fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 16, textTransform: 'uppercase' },
  
  gridSalvos: { 
    display: "flex", 
    flexWrap: "wrap", 
    gap: 16, 
    maxHeight: 420, // altura máxima visível
    overflowY: "auto", // ativa barra de rolagem vertical
    paddingRight: 4, // espaço para barra
  },

  jogoSalvoGrade: { 
    background: "#fff", 
    borderRadius: 12, 
    padding: 12, 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    width: "fit-content",
  },

  gradeSelecao: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, alignItems: 'center' },

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
    borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 10, fontWeight: 700, textTransform: 'uppercase'
  }
};