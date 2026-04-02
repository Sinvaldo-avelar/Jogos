'use client';
import Link from 'next/link';

export default function MenuPrincipal() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>CENTRAL DE JOGOS</h1>
      <p style={styles.subtitle}>Escolha o sistema que deseja operar:</p>
      
      <div style={styles.menu}>
        <Link href="/lotofacil" style={{...styles.card, borderLeft: '8px solid #3b82f6'}}>
          <h2>🍀 LOTOFÁCIL</h2>
          <p>Sistema de Rotação Infinita e Estoque</p>
        </Link>

        <Link href="/lotomania" style={{...styles.card, borderLeft: '8px solid #ef4444'}}>
          <h2>🎱 LOTOMANIA</h2>
          <p>Sistema de 100 números e Duplo Clique (Fixos)</p>
        </Link>

        <Link href="/gerador" style={{...styles.card, borderLeft: '8px solid #10b981'}}>
          <h2>⚙️ GERADOR</h2>
          <p>Gerador de Combinações 7 de 10 (com regra de ouro)</p>
        </Link>

        <Link href="/jogos-salvos" style={{...styles.card, borderLeft: '8px solid #f59e42'}}>
          <h2>💾 JOGOS SALVOS</h2>
          <p>Veja e gerencie todos os seus jogos salvos</p>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  title: { fontSize: '32px', color: '#0f172a', marginBottom: '10px' },
  subtitle: { color: '#64748b', marginBottom: '40px' },
  menu: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '800px',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: 'inherit',
    width: '250px',
    transition: 'transform 0.2s',
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  // Adiciona responsividade para telas pequenas
  '@media (max-width: 600px)': {
    menu: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
    },
    card: {
      width: '90vw',
      minWidth: 'unset',
      maxWidth: '350px',
      padding: '20px',
    },
  },
};