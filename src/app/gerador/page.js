"use client";

import { useState, useEffect } from "react";

const COLUNAS = 4;
const NUMS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Gerador() {
  const [selecionadas, setSelecionadas] = useState(() => Array(COLUNAS).fill().map(() => []));
  const [salvos, setSalvos] = useState([]);
  const [msg, setMsg] = useState("");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("gerador_cartelas");
    if (s) setSalvos(JSON.parse(s));
    setMontado(true);
  }, []);

  const alternarNumero = (colIdx, num) => {
    setMsg("");
    if (num < 1 || num > 10) return;
    setSelecionadas(sel => {
      const novo = sel.map((arr, i) =>
        i === colIdx
          ? arr.includes(num)
            ? arr.filter(n => n !== num)
            : arr.length < 5
              ? [...arr, num]
              : arr
          : arr
      );
      return novo;
    });
  };

  const salvarCartela = () => {
    for (let colIdx = 0; colIdx < COLUNAS; colIdx++) {
      if (selecionadas[colIdx].length !== 5) {
        setMsg(`⚠️ Selecione 5 números na coluna ${colIdx + 1}`);
        return;
      }
    }
    const cartela = selecionadas.map(arr => arr.slice().sort((a, b) => a - b));
    const jaSalvo = salvos.some(salvo => JSON.stringify(salvo) === JSON.stringify(cartela));
    
    if (jaSalvo) {
      setMsg("⚠️ Cartela já foi salva!");
      return;
    }

    const novosSalvos = [cartela, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem("gerador_cartelas", JSON.stringify(novosSalvos));
    setMsg("Cartela salva!");
    setSelecionadas(Array(COLUNAS).fill().map(() => []));
  };

  if (!montado) return null;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>GERADOR DE CARTELA LOTOMANIA</h1>
      
      <div style={styles.msgFeedback}>{msg}</div>

      <div style={styles.layoutPrincipal}>
        {/* Lado Esquerdo: Seletor (Fixo na esquerda) */}
        <div style={styles.colunaEsquerda}>
          <div style={styles.cardPrincipal}>
            <h3 style={styles.cardTitle}>MONTAR NOVO JOGO</h3>
            <div style={styles.gradeSelecao}>
              {Array.from({ length: 4 }, (_, linhaIdx) => (
                <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
                  {NUMS.map(num => {
                    const selecionado = selecionadas[linhaIdx].includes(num);
                    return (
                      <button
                        key={num}
                        style={{
                          ...styles.celulaCartela,
                          background: selecionado ? "#3b82f6" : "#fff",
                          color: selecionado ? "#fff" : "#334155",
                          border: selecionado ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          cursor: selecionado || selecionadas[linhaIdx].length < 5 ? "pointer" : "not-allowed",
                        }}
                        onClick={() => alternarNumero(linhaIdx, num)}
                        disabled={!selecionado && selecionadas[linhaIdx].length >= 5}
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
                background: selecionadas.every(arr => arr.length === 5) ? "#16a34a" : "#cbd5e1",
                cursor: selecionadas.every(arr => arr.length === 5) ? "pointer" : "not-allowed",
              }}
              onClick={salvarCartela}
              disabled={!selecionadas.every(arr => arr.length === 5)}
            >
              SALVAR CARTELA
            </button>
          </div>
        </div>

        {/* Lado Direito: Cartões Salvos */}
        <div style={styles.colunaDireita}>
          <h3 style={styles.cardTitle}>CARTELAS SALVAS ({salvos.length})</h3>
          <div style={styles.gridSalvos}>
            {salvos.map((arr, idx) => (
              <div key={idx} style={styles.jogoSalvoGrade}>
                {/* Numeração da Cartela */}
                <div style={styles.badgeNumero}>Jogo #{salvos.length - idx}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                  {arr.map((linha, linhaIdx) => (
                    <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
                      {NUMS.map(num => {
                        const selecionado = linha.includes(num);
                        return (
                          <span
                            key={num}
                            style={{
                              ...styles.celulaCartela,
                              width: 22,
                              height: 22,
                              fontSize: 10,
                              background: selecionado ? "#3b82f6" : "#f8fafc",
                              color: selecionado ? "#fff" : "#cbd5e1",
                              border: selecionado ? "1px solid #2563eb" : "1px solid #f1f5f9",
                            }}
                          >
                            {num.toString().padStart(2, "0")}
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