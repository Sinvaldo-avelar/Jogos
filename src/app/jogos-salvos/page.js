'use client';
import { useEffect, useState } from 'react';
import { buscarJogos, apagarJogo } from '../../lib/lotomaniaApi';
import Link from 'next/link';

export default function JogosSalvos() {
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
    carregarJogos();
  }, []);

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
        {jogos.map((jogo, idx) => (
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
        ))}
      </div>
    </div>
  );
}
