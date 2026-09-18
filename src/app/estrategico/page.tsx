'use client';

import { useEffect, useState } from 'react';

const TOTAL_NUMEROS = 100;
const ESTADO_VAZIO = 0;
const ESTADO_SELECIONADO = 1;
const ESTADO_FIXO = 2;
const ESTADOS_INICIAIS = Array(TOTAL_NUMEROS).fill(ESTADO_VAZIO);

function formatarNumero(indice: number) {
  return indice === 99 ? '00' : String(indice + 1).padStart(2, '0');
}

function LinhaNumeros({
  valores,
  aoAlternar,
  editando = true,
}: {
  valores: number[];
  aoAlternar?: (indice: number) => void;
  editando?: boolean;
}) {
  return (
    <div style={styles.linhaNumeros}>
      {valores.map((estado, indice) => {
        const selecionado = estado === ESTADO_SELECIONADO || estado === ESTADO_FIXO;
        const fixo = estado === ESTADO_FIXO;

        return (
          <button
            key={indice}
            type="button"
            disabled={!editando}
            onClick={() => aoAlternar?.(indice)}
            style={{
              ...styles.numero,
              background: fixo ? '#ef4444' : selecionado ? '#3b82f6' : '#fff',
              borderColor: fixo ? '#b91c1c' : selecionado ? '#2563eb' : '#cbd5e1',
              color: selecionado ? '#fff' : '#334155',
              cursor: editando ? 'pointer' : 'default',
            }}
          >
            {formatarNumero(indice)}
          </button>
        );
      })}
    </div>
  );
}

export default function Estrategico() {
  const [cartao, setCartao] = useState<number[]>(ESTADOS_INICIAIS);
  const [cartao2, setCartao2] = useState<number[]>(ESTADOS_INICIAIS);
  const [salvos, setSalvos] = useState<number[][]>([]);
  const [mensagem, setMensagem] = useState('');
  const [mensagem2, setMensagem2] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [cartaoEditado, setCartaoEditado] = useState<number[] | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const carregar = window.setTimeout(() => {
      const salvosStorage = localStorage.getItem('estrategico_cartelas');
      if (salvosStorage) setSalvos(JSON.parse(salvosStorage));
      setMontado(true);
    }, 0);

    return () => window.clearTimeout(carregar);
  }, []);

  const alternarNumero = (indice: number) => {
    setMensagem('');
    setCartao((atual) => {
      const proximo = [...atual];
      proximo[indice] = (proximo[indice] + 1) % 3;
      return proximo;
    });
  };

  const alternarNumero2 = (indice: number) => {
    setMensagem2('');
    setCartao2((atual) => {
      const proximo = [...atual];
      proximo[indice] = (proximo[indice] + 1) % 3;
      return proximo;
    });
  };

  const salvarCartao = () => {
    if (!cartao.some((estado) => estado === ESTADO_SELECIONADO || estado === ESTADO_FIXO)) {
      setMensagem('Escolha pelo menos um número.');
      return;
    }

    const jaSalvo = salvos.some((salvo) => JSON.stringify(salvo) === JSON.stringify(cartao));
    if (jaSalvo) {
      setMensagem('Cartão já foi salvo!');
      return;
    }

    const novosSalvos = [cartao, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem('estrategico_cartelas', JSON.stringify(novosSalvos));
    setMensagem('Cartão salvo!');
    setCartao(cartao.map((estado) => (estado === ESTADO_FIXO ? ESTADO_FIXO : ESTADO_VAZIO)));
  };

  const salvarCartao2 = () => {
    if (!cartao2.some((estado) => estado === ESTADO_SELECIONADO || estado === ESTADO_FIXO)) {
      setMensagem2('Escolha pelo menos um número.');
      return;
    }

    const jaSalvo = salvos.some((salvo) => JSON.stringify(salvo) === JSON.stringify(cartao2));
    if (jaSalvo) {
      setMensagem2('Cartão já foi salvo!');
      return;
    }

    const novosSalvos = [cartao2, ...salvos];
    setSalvos(novosSalvos);
    localStorage.setItem('estrategico_cartelas', JSON.stringify(novosSalvos));
    setMensagem2('Cartão salvo!');
    setCartao2(cartao2.map((estado) => (estado === ESTADO_FIXO ? ESTADO_FIXO : ESTADO_VAZIO)));
  };

  const salvarEdicao = () => {
    if (editando === null || !cartaoEditado) return;
    const novosSalvos = salvos.map((salvo, indice) => (indice === editando ? cartaoEditado : salvo));
    setSalvos(novosSalvos);
    localStorage.setItem('estrategico_cartelas', JSON.stringify(novosSalvos));
    setEditando(null);
    setCartaoEditado(null);
  };

  const excluirCartao = (indice: number) => {
    const novosSalvos = salvos.filter((_, itemIndice) => itemIndice !== indice);
    setSalvos(novosSalvos);
    localStorage.setItem('estrategico_cartelas', JSON.stringify(novosSalvos));
  };

  if (!montado) return null;

  const totalEscolhidos = cartao.filter((estado) => estado > 0).length;

  return (
    <main style={styles.container}>
      <button type="button" style={styles.btnVoltar} onClick={() => { window.location.href = '/'; }}>
        ← Voltar para Painel
      </button>
      <h1 style={styles.titulo}>GERADOR ESTRATÉGICO</h1>

      <section style={styles.card}>
        <h2 style={styles.tituloCard}>CARTÃO DE 01 A 99 E 00</h2>
        <p style={styles.contador}>Números escolhidos: {totalEscolhidos}</p>
        <div style={styles.gradeContainer}>
          <LinhaNumeros valores={cartao} aoAlternar={alternarNumero} />
        </div>
        <button type="button" style={styles.btnSalvar} onClick={salvarCartao}>SALVAR CARTÃO</button>
        {mensagem && <div style={styles.mensagem}>{mensagem}</div>}
      </section>

      <section style={{ ...styles.card, marginTop: 20 }}>
        <h2 style={styles.tituloCard}>SEGUNDO GERADOR</h2>
        <p style={styles.contador}>Números escolhidos: {cartao2.filter((estado) => estado > 0).length}</p>
        <div style={styles.gradeContainer}>
          <LinhaNumeros valores={cartao2} aoAlternar={alternarNumero2} />
        </div>
        <button type="button" style={styles.btnSalvar} onClick={salvarCartao2}>SALVAR CARTÃO</button>
        {mensagem2 && <div style={styles.mensagem}>{mensagem2}</div>}
      </section>

      <section style={styles.salvosSection}>
        <h2 style={styles.tituloCard}>CARTÕES SALVOS ({salvos.length})</h2>
        <div style={styles.listaSalvos}>
          {salvos.map((salvo, indice) => {
            const emEdicao = editando === indice;
            return (
              <article key={indice} style={styles.cardSalvo}>
                <strong style={styles.badge}>Cartão #{salvos.length - indice}</strong>
                <div style={styles.gradeContainer}>
                  <LinhaNumeros
                    valores={emEdicao ? cartaoEditado! : salvo}
                    editando={emEdicao}
                    aoAlternar={(numero) => setCartaoEditado((atual) => atual?.map((estado, item) => item === numero ? (estado + 1) % 3 : estado) ?? null)}
                  />
                </div>
                <div style={styles.acoes}>
                  {emEdicao ? (
                    <>
                      <button type="button" style={styles.btnAcao} onClick={salvarEdicao}>Salvar</button>
                      <button type="button" style={styles.btnAcao} onClick={() => { setEditando(null); setCartaoEditado(null); }}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button type="button" style={styles.btnAcao} onClick={() => { setEditando(indice); setCartaoEditado([...salvo]); }}>Editar</button>
                      <button type="button" style={{ ...styles.btnAcao, color: '#dc2626' }} onClick={() => excluirCartao(indice)}>Excluir</button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: { background: '#f1f5f9', minHeight: '100vh', padding: '32px 20px', fontFamily: 'sans-serif' },
  btnVoltar: { background: '#e0e7ef', border: 'none', borderRadius: 8, padding: '10px 15px', fontWeight: 700, cursor: 'pointer' },
  titulo: { fontSize: 24, fontWeight: 900, color: '#0f172a', textAlign: 'center' as const, margin: '24px 0' },
  card: { background: '#fff', maxWidth: 1100, margin: '0 auto', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 8px rgba(15, 23, 42, 0.08)' },
  tituloCard: { fontSize: 13, fontWeight: 800, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase' as const },
  contador: { margin: '0 0 12px', fontWeight: 600, color: '#0f172a' },
  gradeContainer: { width: '100%', paddingBottom: 8 },
  linhaNumeros: { display: 'grid', gridTemplateColumns: 'repeat(50, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, auto)', gap: 3, width: '100%' },
  numero: { width: '100%', minWidth: 0, aspectRatio: '1.1', padding: 0, borderWidth: 1, borderStyle: 'solid', borderRadius: 4, fontSize: 13, fontWeight: 800 },
  btnSalvar: { width: '100%', marginTop: 10, padding: 12, border: 'none', borderRadius: 8, background: '#16a34a', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  mensagem: { marginTop: 8, color: '#16a34a', fontWeight: 600 },
  salvosSection: { maxWidth: 1100, margin: '28px auto 0' },
  listaSalvos: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  cardSalvo: { background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' },
  badge: { display: 'inline-block', background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '3px 8px', borderRadius: 10, marginBottom: 8 },
  acoes: { display: 'flex', gap: 8, marginTop: 8 },
  btnAcao: { flex: 1, padding: 7, border: 'none', borderRadius: 6, background: '#e2e8f0', color: '#334155', fontWeight: 700, cursor: 'pointer' },
};