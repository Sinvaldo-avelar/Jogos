'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

import { salvarJogo as salvarJogoSupabase, buscarJogos as buscarJogosSupabase, apagarJogo as apagarJogoSupabase, salvarResultadoLotomania, buscarResultadosLotomania } from '../../lib/lotomaniaApi';



export default function Lotomania() {
  // Resultados salvos
  const [resultados, setResultados] = useState([]);
  const [carregandoResultados, setCarregandoResultados] = useState(true);

  // Buscar resultados ao montar
  useEffect(() => {
    async function carregarResultados() {
      try {
        const data = await buscarResultadosLotomania();
        setResultados(data || []);
      } catch {
        setResultados([]);
      }
      setCarregandoResultados(false);
    }
    carregarResultados();
  }, []);
  // Estado para adicionar resultado manual
  const [adicionandoResultado, setAdicionandoResultado] = useState(false);
  const [novoResultado, setNovoResultado] = useState({ concurso: '', data: '', numeros: '' });
  const [salvandoResultado, setSalvandoResultado] = useState(false);
  const [erroResultado, setErroResultado] = useState('');

  // Função para salvar resultado no Supabase
  const handleSalvarResultado = async () => {
    setErroResultado('');
    setSalvandoResultado(true);
    try {
      // Validação simples
      if (!novoResultado.concurso || !novoResultado.data || !novoResultado.numeros) {
        setErroResultado('Preencha todos os campos!');
        setSalvandoResultado(false);
        return;
      }
      // Números: transformar string em array de inteiros
      const numerosArr = novoResultado.numeros
        .split(/\D+/)
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n) && n >= 0 && n <= 99);
      if (numerosArr.length !== 20) {
        setErroResultado('Informe exatamente 20 dezenas!');
        setSalvandoResultado(false);
        return;
      }
      await salvarResultadoLotomania({
        concurso: parseInt(novoResultado.concurso, 10),
        data: novoResultado.data,
        numeros: numerosArr,
      });
      setNovoResultado({ concurso: '', data: '', numeros: '' });
      setAdicionandoResultado(false);
      alert('Resultado salvo com sucesso!');
    } catch (e) {
      setErroResultado('Erro ao salvar resultado!');
    }
    setSalvandoResultado(false);
  };
  const [jogos, setJogos] = useState([]);
  const [resultadoInput, setResultadoInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [fixos, setFixos] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [nulos, setNulos] = useState([]);

  useEffect(() => {
    async function carregarJogos() {
      try {
        const data = await buscarJogosSupabase();
        // data pode ser null ou []
        setJogos((data || []).map(j => j.numeros));
      } catch {
        setJogos([]);
      }
      setMounted(true);
    }
    carregarJogos();
  }, []);

  const dezenasVolante = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => i + 1);
  }, []);

  const dezenasSorteadas = useMemo(() => {
    const numeros = resultadoInput.trim().split(/\s+/).map(n => {
        let num = Number(n);
        return num === 0 ? 100 : num;
    }).filter(n => n >= 1 && n <= 100);
    return [...new Set(numeros)].slice(0, 20);
  }, [resultadoInput]);

  const alternarSelecao = (n) => {
    const isNulo = nulos.includes(n);
    const isFixo = fixos.includes(n);
    const isSel = selecionados.includes(n);

    if (!isSel && !isFixo && !isNulo) {
      // 1º clique: seleciona (azul)
      if (selecionados.length < 50) setSelecionados([...selecionados, n]);
    } else if (isSel && !isFixo && !isNulo) {
      // 2º clique: fixa (vermelho)
      setFixos([...fixos, n]);
    } else if (isFixo && !isNulo) {
      // 3º clique: nulo (cinza)
      setFixos(fixos.filter(x => x !== n));
      setSelecionados(selecionados.filter(x => x !== n));
      setNulos([...nulos, n]);
    } else if (isNulo) {
      // 4º clique: volta ao normal
      setNulos(nulos.filter(x => x !== n));
    }
  };

  const salvarJogo = async () => {
    const selecionadosValidos = selecionados.filter(n => !nulos.includes(n));
    if (selecionadosValidos.length === 50) {
      const novoJogo = [...selecionadosValidos].sort((a, b) => a - b);
      const jogoJaExiste = jogos.some(j => JSON.stringify(j) === JSON.stringify(novoJogo));
      if (editandoIndex !== null) {
        // Atualiza no Supabase: remove o antigo e salva o novo
        try {
          // Buscar todos os jogos do Supabase para pegar o id
          const data = await buscarJogosSupabase();
          const jogoAntigo = data[editandoIndex];
          if (jogoAntigo) {
            await apagarJogoSupabase(jogoAntigo.id);
            await salvarJogoSupabase(novoJogo);
            const novosJogos = [...jogos];
            novosJogos[editandoIndex] = novoJogo;
            setJogos(novosJogos);
            setEditandoIndex(null);
          }
        } catch {
          alert('Erro ao editar jogo no banco de dados!');
        }
      } else {
        if (jogoJaExiste) {
          alert("⚠️ ESSE JOGO JÁ ESTÁ SALVO! Escolha dezenas diferentes.");
          return;
        }
        try {
          await salvarJogoSupabase(novoJogo);
          setJogos([novoJogo, ...jogos]);
        } catch {
          alert('Erro ao salvar no banco de dados!');
        }
      }
      setSelecionados([...fixos]);
    } else {
      alert("Escolha exatamente 50 números válidos (azuis/vermelhos).");
    }
  };

  const prepararEdicao = (index) => {
    const jogoParaEditar = jogos[index];
    setSelecionados(jogoParaEditar);
    setFixos([]);
    setNulos([]);
    setEditandoIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const analise = useMemo(() => {
    const gasto = jogos.length * 3.00;
    const cont = { c0: 0, c15: 0, c16: 0, c17: 0, c18: 0, c19: 0, c20: 0 };

    const lista = jogos
      .filter(jogo => Array.isArray(jogo) && jogo.every(n => typeof n === 'number'))
      .map(jogo => {
        const acertos = jogo.filter(n => dezenasSorteadas.includes(n)).length;
        if (acertos === 0) cont.c0++;
        if (acertos === 15) cont.c15++;
        if (acertos === 16) cont.c16++;
        if (acertos === 17) cont.c17++;
        if (acertos === 18) cont.c18++;
        if (acertos === 19) cont.c19++;
        if (acertos === 20) cont.c20++;
        return { jogo, acertos };
      });

    return { lista, gasto, cont };
  }, [jogos, dezenasSorteadas]);

  if (!mounted) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/" style={styles.btnVoltar}>← Menu</Link>
          <h1 style={styles.title}>PAINEL LOTOMANIA</h1>
        </div>
        <button style={styles.btnLimpar} onClick={() => confirm("Zerar tudo?") && setJogos([])}>Limpar Tudo</button>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.sidebar}>
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>VOLANTE ({selecionados.length}/50)</h3>
            <div style={styles.volanteGrid}>
              {dezenasVolante.map(n => {
                const isNulo = nulos.includes(n);
                const isFixo = fixos.includes(n);
                const isSel = selecionados.includes(n);
                let bgColor = isNulo ? '#a3a3a3' : (isFixo ? '#ef4444' : (isSel ? '#3b82f6' : '#f1f5f9'));
                let color = isNulo ? '#f1f5f9' : ((isSel || isFixo) ? 'white' : '#64748b');
                return (
                  <button key={n} onClick={() => alternarSelecao(n)}
                    style={{ ...styles.vBtn, backgroundColor: bgColor, color, opacity: isNulo ? 0.5 : 1 }}>
                    {n === 100 ? '00' : String(n).padStart(2, '0')}
                  </button>
                )
              })}
            </div>
            <button onClick={salvarJogo} style={{ ...styles.btnSalvar, backgroundColor: selecionados.length === 50 ? (editandoIndex !== null ? '#f59e0b' : '#16a34a') : '#cbd5e1' }}>
              {editandoIndex !== null ? 'CONFIRMAR EDIÇÃO' : 'SALVAR JOGO'}
            </button>
            {editandoIndex !== null && <button onClick={() => {setEditandoIndex(null); setSelecionados([]);}} style={styles.btnCancelar}>Cancelar Edição</button>}
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>CONFERIDOR</h3>
            {/* Select para escolher concurso salvo */}
            <div style={{ marginBottom: 8 }}>
              <select
                style={{ ...styles.inputRes, width: '100%', marginBottom: 8 }}
                value={resultadoInput}
                onChange={e => {
                  const val = e.target.value;
                  setResultadoInput(val);
                }}
                disabled={carregandoResultados || resultados.length === 0}
              >
                <option value="">Selecione um concurso salvo...</option>
                {resultados.map(r => (
                  <option key={r.id} value={Array.isArray(r.numeros) ? r.numeros.join(' ') : r.numeros}>
                    Concurso {r.concurso} - {r.data}
                  </option>
                ))}
              </select>
            </div>
            {/* Input manual, caso queira digitar */}
            <input style={styles.inputRes} placeholder="Ou cole as 20 dezenas aqui..." value={resultadoInput} onChange={(e) => setResultadoInput(e.target.value)} />
            <div style={styles.resumoAcertos}>
              <div style={styles.resItem}><span>20pt</span><b>{analise.cont.c20}</b></div>
              <div style={styles.resItem}><span>19pt</span><b>{analise.cont.c19}</b></div>
              <div style={styles.resItem}><span>18pt</span><b>{analise.cont.c18}</b></div>
              <div style={styles.resItem}><span>17pt</span><b>{analise.cont.c17}</b></div>
              <div style={styles.resItem}><span>16pt</span><b>{analise.cont.c16}</b></div>
              <div style={styles.resItem}><span>15pt</span><b>{analise.cont.c15}</b></div>
              <div style={styles.resItem}><span style={{ color: 'red' }}>0pt</span><b>{analise.cont.c0}</b></div>
            </div>
            <div style={{ marginTop: 16 }}>
              {!adicionandoResultado ? (
                <button style={{ ...styles.btnSalvar, backgroundColor: '#0ea5e9', marginTop: 0 }} onClick={() => setAdicionandoResultado(true)}>
                  + Adicionar resultado
                </button>
              ) : (
                <div style={{ marginTop: 10, background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      style={{ ...styles.inputRes, width: 90, marginBottom: 0 }}
                      placeholder="Concurso"
                      type="number"
                      value={novoResultado.concurso}
                      onChange={e => setNovoResultado({ ...novoResultado, concurso: e.target.value })}
                    />
                    <input
                      style={{ ...styles.inputRes, width: 120, marginBottom: 0 }}
                      placeholder="Data"
                      type="date"
                      value={novoResultado.data}
                      onChange={e => setNovoResultado({ ...novoResultado, data: e.target.value })}
                    />
                  </div>
                  <input
                    style={{ ...styles.inputRes, marginBottom: 8 }}
                    placeholder="20 dezenas separadas por espaço ou vírgula"
                    value={novoResultado.numeros}
                    onChange={e => setNovoResultado({ ...novoResultado, numeros: e.target.value })}
                  />
                  {erroResultado && <div style={{ color: 'red', fontSize: 11, marginBottom: 6 }}>{erroResultado}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.btnSalvar, backgroundColor: '#16a34a', width: 'auto', padding: '8px 16px' }}
                      onClick={handleSalvarResultado}
                      disabled={salvandoResultado}
                    >
                      Salvar
                    </button>
                    <button
                      style={{ ...styles.btnCancelar, width: 'auto', padding: '8px 16px' }}
                      onClick={() => { setAdicionandoResultado(false); setErroResultado(''); }}
                      disabled={salvandoResultado}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={styles.cardTitle}>JOGOS SALVOS (R$ {analise.gasto.toFixed(2)})</h3>
          <div style={styles.gridJogos}>
            {analise.lista.map((item, idx) => (
              <div key={idx} style={{...styles.jogoCard, borderLeft: editandoIndex === idx ? '5px solid #f59e0b' : '1px solid #e2e8f0'}}>
                <div style={styles.cardHead}>
                  <b>BILHETE #{jogos.length - idx}</b>
                  <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => prepararEdicao(idx)} style={{background:'none', border:'none', cursor:'pointer'}}>✏️</button>
                    <button onClick={async () => {
                      // Apaga do Supabase e do estado
                      try {
                        const data = await buscarJogosSupabase();
                        const jogo = data[idx];
                        if (jogo) await apagarJogoSupabase(jogo.id);
                        setJogos(jogos.filter((_, i) => i !== idx));
                      } catch {
                        alert('Erro ao apagar do banco de dados!');
                      }
                    }} style={{background:'none', border:'none', cursor:'pointer'}}>✕</button>
                  </div>
                </div>
                <div style={{fontSize: '11px', marginBottom: '8px', color: (item.acertos >= 15 || item.acertos === 0) ? '#16a34a' : '#64748b'}}>
                  <b>{item.acertos} ACERTOS</b>
                </div>
                {editandoIndex === idx ? (
                  <>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px', marginTop: '6px', marginBottom: '6px'}}>
                      {Array.from({ length: 100 }, (_, i) => {
                        const n = i + 1;
                        const isNulo = nulos.includes(n);
                        const isFixo = fixos.includes(n);
                        const isSel = selecionados.includes(n);
                        let bgColor = isNulo ? '#a3a3a3' : (isFixo ? '#ef4444' : (isSel ? '#3b82f6' : '#f1f5f9'));
                        let color = isNulo ? '#f1f5f9' : ((isSel || isFixo) ? 'white' : '#64748b');
                        return (
                          <button key={n} onClick={() => alternarSelecao(n)}
                            style={{ ...styles.vBtn, backgroundColor: bgColor, color, opacity: isNulo ? 0.5 : 1 }}>
                            {n === 100 ? '00' : String(n).padStart(2, '0')}
                          </button>
                        )
                      })}
                    </div>
                    <button onClick={salvarJogo} style={{ ...styles.btnSalvar, backgroundColor: selecionados.length === 50 ? '#f59e0b' : '#cbd5e1' }}>
                      CONFIRMAR EDIÇÃO
                    </button>
                    <button onClick={() => {setEditandoIndex(null); setSelecionados([]); setFixos([]); setNulos([]);}} style={styles.btnCancelar}>Cancelar Edição</button>
                  </>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: '2px',
                    marginTop: '6px',
                    marginBottom: '6px',
                  }}>
                    {Array.from({ length: 100 }, (_, i) => {
                      const n = i + 1;
                      const marcado = item.jogo.includes(n);
                      const sorteado = dezenasSorteadas.includes(n);
                      let bgColor = marcado ? (sorteado ? '#22c55e' : '#3b82f6') : '#e5e7eb';
                      let color = marcado ? 'white' : '#a3a3a3';
                      return (
                        <span key={n} style={{
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color,
                          fontSize: '8px',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          backgroundColor: bgColor,
                          opacity: marcado ? 1 : 0.5
                        }}>
                          {n === 100 ? '00' : String(n).padStart(2, '0')}
                        </span>
                      );
                    })}
                  </div>
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
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' },
  btnVoltar: { textDecoration: 'none', fontSize: '12px', background: '#cbd5e1', padding: '5px 10px', borderRadius: '5px', color: '#334155' },
  title: { fontSize: '20px', color: '#0f172a', margin: 0 },
  btnLimpar: { backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' },
  mainLayout: { display: 'flex', gap: '20px' },
  sidebar: { width: '380px', display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: '10px', fontWeight: '800', marginBottom: '10px', color: '#94a3b8', textTransform: 'uppercase' },
  volanteGrid: { display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px' },
  vBtn: { height: '32px', border: 'none', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' },
  btnSalvar: { width: '100%', marginTop: '15px', padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  btnCancelar: { width: '100%', marginTop: '5px', padding: '8px', border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' },
  inputRes: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', outline: 'none' },
  resumoAcertos: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '11px', background: '#f8fafc', padding: '10px', borderRadius: '8px' },
  resItem: { textAlign: 'center', display: 'flex', flexDirection: 'column' },
  gridJogos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', maxHeight: '80vh', overflowY: 'auto' },
  jogoCard: { backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  cardHead: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' },
  miniVolante: { display: 'flex', flexWrap: 'wrap', gap: '2px' },
  ball: { width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', borderRadius: '3px', fontWeight: 'bold' }
};