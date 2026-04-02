'use client';

import { useState, useEffect, useMemo } from 'react';

export default function Home() {
  const [jogosProcessados, setJogosProcessados] = useState([]);
  const [resultadoInput, setResultadoInput] = useState("");
  const [custoPorJogo, setCustoPorJogo] = useState(3.50); 
  const [premio14, setPremio14] = useState(1500.00);
  const [premio15, setPremio15] = useState(500000.00);
  const [mounted, setMounted] = useState(false);
  const [volanteSelecionados, setVolanteSelecionados] = useState([]);
  const [indexEdicaoLocal, setIndexEdicaoLocal] = useState(null);
  const [tempJogoEdit, setTempJogoEdit] = useState([]);
  
  // Números que sobraram do último jogo (Obrigatórios para o próximo)
  const [numerosObrigatoriosEspelho, setNumerosObrigatoriosEspelho] = useState([]);

  useEffect(() => {
    const salvos = localStorage.getItem('estrategia_jogos');
    const resultadoSalvo = localStorage.getItem('estrategia_resultado');
    const obrigatoriosSalvos = localStorage.getItem('estrategia_obrigatorios');

    if (salvos) setJogosProcessados(JSON.parse(salvos));
    if (resultadoSalvo) setResultadoInput(resultadoSalvo);
    if (obrigatoriosSalvos) setNumerosObrigatoriosEspelho(JSON.parse(obrigatoriosSalvos));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('estrategia_jogos', JSON.stringify(jogosProcessados));
      localStorage.setItem('estrategia_resultado', resultadoInput);
      localStorage.setItem('estrategia_obrigatorios', JSON.stringify(numerosObrigatoriosEspelho));
    }
  }, [jogosProcessados, resultadoInput, numerosObrigatoriosEspelho, mounted]);

  const dezenasSorteadas = useMemo(() => {
    const numeros = resultadoInput.trim().split(/\s+/).map(Number).filter(n => n > 0 && n <= 25);
    return [...new Set(numeros)].slice(0, 15);
  }, [resultadoInput]);

  const analise = useMemo(() => {
    const investimentoTotal = jogosProcessados.length * custoPorJogo;
    let totalPremios = 0;
    let c11 = 0, c12 = 0, c13 = 0, c14 = 0, c15 = 0;

    const lista = jogosProcessados.map((jogo) => {
      const acertos = jogo.filter(n => dezenasSorteadas.includes(n)).length;
      if (acertos === 11) { totalPremios += 7; c11++; }
      if (acertos === 12) { totalPremios += 14; c12++; }
      if (acertos === 13) { totalPremios += 35; c13++; }
      if (acertos === 14) { totalPremios += premio14; c14++; }
      if (acertos === 15) { totalPremios += premio15; c15++; }
      return { jogo, acertos };
    });

    return { 
      lista, totalPremios, investimentoTotal, 
      saldo: totalPremios - investimentoTotal,
      cont: { c11, c12, c13, c14, c15 } 
    };
  }, [jogosProcessados, dezenasSorteadas, custoPorJogo, premio14, premio15]);

  const alternarSelecao = (n) => {
    // Trava os números que vieram da sobra do jogo anterior
    if (numerosObrigatoriosEspelho.includes(n) && volanteSelecionados.includes(n)) return;

    if (volanteSelecionados.includes(n)) {
      setVolanteSelecionados(volanteSelecionados.filter(num => num !== n));
    } else {
      if (volanteSelecionados.length < 15) {
        setVolanteSelecionados([...volanteSelecionados, n].sort((a, b) => a - b));
      }
    }
  };

  const salvarNovoJogo = () => {
    if (volanteSelecionados.length === 15) {
      const jogoAtual = [...volanteSelecionados];
      setJogosProcessados([jogoAtual, ...jogosProcessados]);

      // CICLO INFINITO: Pega as sobras desse jogo para o PRÓXIMO
      const todos = Array.from({ length: 25 }, (_, i) => i + 1);
      const sobraramParaProximo = todos.filter(n => !jogoAtual.includes(n));
      
      setNumerosObrigatoriosEspelho(sobraramParaProximo);
      setVolanteSelecionados(sobraramParaProximo); 
      alert("✅ Jogo salvo! As sobras já foram carregadas no volante.");
    }
  };

  if (!mounted) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>GERENCIADOR DE FORTUNA</h1>
          <p style={styles.subtitle}>SISTEMA DE ROTAÇÃO INFINITA ATIVO</p>
        </div>
        <button style={styles.btnLimpar} onClick={() => confirm("Zerar tudo?") && (setJogosProcessados([]), setNumerosObrigatoriosEspelho([]), setVolanteSelecionados([]))}>Zerar Sistema</button>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.sidebar}>
          
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>VOLANTE ({volanteSelecionados.length}/15)</h3>
            <div style={styles.volanteGrid}>
              {Array.from({ length: 25 }, (_, i) => i + 1).map(n => {
                const isSel = volanteSelecionados.includes(n);
                const isObrigatorio = numerosObrigatoriosEspelho.includes(n);
                
                let bgColor = '#f1f5f9';
                let textColor = '#64748b';
                if (isSel) { bgColor = isObrigatorio ? '#16a34a' : '#3b82f6'; textColor = 'white'; }
                
                return (
                  <button key={n} onClick={() => alternarSelecao(n)}
                  style={{...styles.vBtn, backgroundColor: bgColor, color: textColor, border: isObrigatorio ? '2px solid #15803d' : 'none'}}>
                    {n}{isObrigatorio ? '⭐' : ''}
                  </button>
                )
              })}
            </div>
            <button onClick={salvarNovoJogo} disabled={volanteSelecionados.length !== 15} style={{...styles.btnSalvar, backgroundColor: volanteSelecionados.length === 15 ? '#22c55e' : '#cbd5e1'}}>
              SALVAR JOGO
            </button>
          </section>

          {/* PAINEL FINANCEIRO RECUPERADO */}
          <section style={styles.cardFinanceiro}>
            <h3 style={styles.cardTitle}>BALANÇO FINANCEIRO</h3>
            <div style={styles.finRow}><span>Jogos Feitos:</span> <b>{jogosProcessados.length}</b></div>
            <div style={styles.finRow}><span>Total Gasto:</span> <b>R$ {analise.investimentoTotal.toFixed(2)}</b></div>
            <div style={styles.finRow}><span>Total Ganho:</span> <b style={{color: '#16a34a'}}>R$ {analise.totalPremios.toFixed(2)}</b></div>
            <div style={{...styles.saldoBox, color: analise.saldo >= 0 ? '#16a34a' : '#dc2626'}}>
               SALDO: R$ {analise.saldo.toFixed(2)}
            </div>
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>CONFERIR RESULTADO</h3>
            <input style={styles.inputRes} placeholder="01 02 03..." value={resultadoInput} onChange={(e) => setResultadoInput(e.target.value)} />
            
            <div style={styles.premiosGrid}>
              <div style={styles.premioItem}><span>11 pts</span><b>{analise.cont.c11}</b></div>
              <div style={styles.premioItem}><span>12 pts</span><b>{analise.cont.c12}</b></div>
              <div style={styles.premioItem}><span>13 pts</span><b>{analise.cont.c13}</b></div>
              <div style={styles.premioItem}><span>14 pts</span><b>{analise.cont.c14}</b></div>
              <div style={styles.premioItem}><span>15 pts</span><b>{analise.cont.c15}</b></div>
            </div>
          </section>
        </div>

        <div style={{ flex: 1 }}>
          <div style={styles.gridJogos}>
            {analise.lista.map((item, idx) => (
              <div key={idx} style={{...styles.jogoCard, borderColor: indexEdicaoLocal === idx ? '#f59e0b' : '#e2e8f0'}}>
                <div style={styles.cardHead}>
                  <b>#{jogosProcessados.length - idx}</b>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => {setIndexEdicaoLocal(idx); setTempJogoEdit(item.jogo);}} style={{background:'none', border:'none', cursor:'pointer'}}>✏️</button>
                    <button onClick={() => setJogosProcessados(jogosProcessados.filter((_, i) => i !== idx))} style={{background:'none', border:'none', cursor:'pointer'}}>✕</button>
                  </div>
                </div>

                {indexEdicaoLocal === idx ? (
                  <div style={styles.volanteExibicao}>
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(n => {
                      const sel = tempJogoEdit.includes(n);
                      return (
                        <button key={n} onClick={() => sel ? setTempJogoEdit(tempJogoEdit.filter(x => x !== n)) : tempJogoEdit.length < 15 && setTempJogoEdit([...tempJogoEdit, n].sort((a,b)=>a-b))}
                        style={{...styles.ballExibicao, backgroundColor: sel ? '#f59e0b' : '#f1f5f9', color: sel ? 'white' : '#94a3b8', border: 'none', cursor:'pointer'}}>{n}</button>
                      )
                    })}
                    <button onClick={() => { if(tempJogoEdit.length === 15) { const n = [...jogosProcessados]; n[idx] = tempJogoEdit; setJogosProcessados(n); setIndexEdicaoLocal(null); }}} style={styles.btnConfirmarEdit}>OK</button>
                  </div>
                ) : (
                  <>
                    <div style={{fontSize: '11px', fontWeight: 'bold', color: item.acertos >= 11 ? '#16a34a' : '#64748b', marginBottom:'5px'}}>{item.acertos} ACERTOS</div>
                    <div style={styles.volanteExibicao}>
                      {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                        <span key={n} style={{...styles.ballExibicao, backgroundColor: item.jogo.includes(n) ? (dezenasSorteadas.includes(n) ? '#22c55e' : '#475569') : '#f8fafc', color: item.jogo.includes(n) ? 'white' : '#cbd5e1'}}>
                          {String(n).padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '18px', color: '#0f172a' },
  subtitle: { margin: 0, fontSize: '9px', color: '#64748b', fontWeight: 'bold' },
  btnLimpar: { backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' },
  mainLayout: { display: 'flex', gap: '20px' },
  sidebar: { width: '280px', display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  cardFinanceiro: { backgroundColor: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #dbeafe' },
  cardTitle: { fontSize: '9px', color: '#94a3b8', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase' },
  volanteGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' },
  vBtn: { height: '35px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' },
  btnSalvar: { width: '100%', marginTop: '10px', padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  finRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' },
  saldoBox: { marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dbeafe', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' },
  inputRes: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '14px', marginBottom: '10px' },
  premiosGrid: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
  premioItem: { textAlign: 'center', fontSize: '9px', display: 'flex', flexDirection: 'column' },
  gridJogos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '85vh', overflowY: 'auto' },
  jogoCard: { padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white' },
  cardHead: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '10px' },
  volanteExibicao: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px' },
  ballExibicao: { width: '100%', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' },
  btnConfirmarEdit: { gridColumn: 'span 5', marginTop: '5px', padding: '4px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '3px', fontSize: '9px', cursor:'pointer' }
};