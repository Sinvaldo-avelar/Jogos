'use client';
import { useEffect, useState } from 'react';
import { buscarJogos, apagarJogo, buscarResultadosLotomania } from '../../lib/lotomaniaApi';
import Link from 'next/link';

export default function JogosSalvos() {
  // Resultados salvos
  const [resultados, setResultados] = useState([]);
  const [carregandoResultados, setCarregandoResultados] = useState(true);
  const [concursoSelecionado, setConcursoSelecionado] = useState("");
  const [dezenasSorteadas, setDezenasSorteadas] = useState([]);
  const [contagemAcertos, setContagemAcertos] = useState({ c20: 0, c19: 0, c18: 0, c17: 0, c16: 0, c15: 0, c0: 0 });
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);


  useEffect(() => {
    async function carregarJogos() {
      setLoading(true);
      setErro(null);
      try {
        const data = await buscarJogos();
        setJogos(data);
      } catch (e) {
        setErro('Erro ao buscar jogos');
      }
      setLoading(false);
    }
    async function carregarResultados() {
      try {
        const data = await buscarResultadosLotomania();
        setResultados(data || []);
      } catch {
        setResultados([]);
      }
      setCarregandoResultados(false);
    }
    carregarJogos();
    carregarResultados();
  }, []);

  // Atualiza dezenas sorteadas e contagem ao selecionar concurso
  useEffect(() => {
    if (!concursoSelecionado) {
      setDezenasSorteadas([]);
      setContagemAcertos({ c20: 0, c19: 0, c18: 0, c17: 0, c16: 0, c15: 0, c0: 0 });
      return;
    }
    const resultado = resultados.find(r => String(r.concurso) === String(concursoSelecionado));
    if (!resultado) return;
    let dezenas = resultado.numeros;
    if (typeof dezenas === 'string') {
      dezenas = dezenas.split(/\D+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    }
    setDezenasSorteadas(dezenas);
    // Contar acertos
    const cont = { c20: 0, c19: 0, c18: 0, c17: 0, c16: 0, c15: 0, c0: 0 };
    jogos.forEach(jogo => {
      const acertos = jogo.numeros.filter(n => dezenas.includes(n)).length;
      if (acertos === 20) cont.c20++;
      if (acertos === 19) cont.c19++;
      if (acertos === 18) cont.c18++;
      if (acertos === 17) cont.c17++;
      if (acertos === 16) cont.c16++;
      if (acertos === 15) cont.c15++;
      if (acertos === 0) cont.c0++;
    });
    setContagemAcertos(cont);
  }, [concursoSelecionado, resultados, jogos]);

  async function handleDelete(id) {
    if (!window.confirm('Deseja realmente apagar este jogo?')) return;
    try {
      await apagarJogo(id);
      setJogos(jogos.filter(j => j.id !== id));
    } catch {
      alert('Erro ao apagar jogo');
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    const numeros = novoJogo.trim().split(/\s|,/).map(n => Number(n)).filter(n => n >= 0 && n <= 100);
    if (numeros.length === 0) {
      alert('Digite ao menos um número válido!');
      return;
    }
    setSalvando(true);
    try {
      const data = await salvarJogo(numeros);
      setJogos([...jogos, ...(data || [])]);
      setNovoJogo("");
    } catch {
      alert('Erro ao salvar jogo');
    }
    setSalvando(false);
  }

  return (
    <div style={{padding: 32, maxWidth: 600, margin: '0 auto'}}>
      <h1>Jogos Salvos - Lotomania</h1>
      {/* Select para escolher concurso salvo */}
      <div style={{ margin: '16px 0' }}>
        <select
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15 }}
          value={concursoSelecionado}
          onChange={e => setConcursoSelecionado(e.target.value)}
          disabled={carregandoResultados || resultados.length === 0}
        >
          <option value="">Selecione um concurso para conferir...</option>
          {resultados.map(r => (
            <option key={r.id} value={r.concurso}>
              Concurso {r.concurso} - {r.data}
            </option>
          ))}
        </select>
      </div>
      {/* Resumo de acertos */}
      {concursoSelecionado && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div><b>20 acertos:</b> {contagemAcertos.c20}</div>
          <div><b>19 acertos:</b> {contagemAcertos.c19}</div>
          <div><b>18 acertos:</b> {contagemAcertos.c18}</div>
          <div><b>17 acertos:</b> {contagemAcertos.c17}</div>
          <div><b>16 acertos:</b> {contagemAcertos.c16}</div>
          <div><b>15 acertos:</b> {contagemAcertos.c15}</div>
          <div style={{ color: 'red' }}><b>0 acertos:</b> {contagemAcertos.c0}</div>
        </div>
      )}
      <Link href="/lotomania" style={{
        display: 'inline-block',
        marginBottom: 24,
        background: '#3b82f6',
        color: 'white',
        padding: '8px 18px',
        borderRadius: 6,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: 14
      }}>
        ← Voltar para Lotomania
      </Link>
      {loading && <p>Carregando...</p>}
      {erro && <p style={{color: 'red'}}>{erro}</p>}
      {!loading && !erro && jogos.length === 0 && <p>Nenhum jogo salvo.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {jogos.map((jogo, idx) => {
          let acertos = null;
          if (concursoSelecionado && dezenasSorteadas.length > 0) {
            acertos = jogo.numeros.filter(n => dezenasSorteadas.includes(n)).length;
          }
          return (
            <div key={jogo.id} style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              padding: 16,
              marginBottom: 8,
              borderLeft: '5px solid #ef4444',
              maxWidth: 340
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <b>BILHETE #{jogos.length - idx}</b>
                <button onClick={() => handleDelete(jogo.id)} style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer'}}>Apagar</button>
              </div>
              {acertos !== null && (
                <div style={{ fontSize: 13, marginBottom: 6, color: (acertos >= 15 || acertos === 0) ? '#16a34a' : '#64748b' }}>
                  <b>{acertos} ACERTOS</b>
                </div>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: 2,
                marginTop: 6,
                marginBottom: 6
              }}>
                {Array.from({ length: 100 }, (_, i) => {
                  const n = i + 1;
                  const marcado = jogo.numeros.includes(n);
                  return (
                    <span key={n} style={{
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: marcado ? 'white' : '#a3a3a3',
                      fontSize: 10,
                      borderRadius: 3,
                      fontWeight: 'bold',
                      backgroundColor: marcado ? '#3b82f6' : '#e5e7eb',
                      opacity: marcado ? 1 : 0.5
                    }}>
                      {n === 100 ? '00' : String(n).padStart(2, '0')}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
