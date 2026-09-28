"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

const COLUNAS_QTD = 5;
const LINHAS_QTD = 20;
const NUMS = Array.from({ length: COLUNAS_QTD }, (_, i) => i + 1);

const STORAGE_CARTELAS_FIXAS_KEY = "gerador_cartelas_fixas_5x20";
const STORAGE_CARTELAS_SALVAS_KEY = "gerador_cartelas_5x20_salvas";
const STORAGE_GABARITOS_KEY = "gerador_gabaritos_5x20_transparentes";
const STORAGE_TRAVA_GERAL_KEY = "gerador_trava_geral_5x20";

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

interface CartelaFixa5x20Item {
  id: number;
  numeroCartela: number;
  selecionadas: number[][];
  msg: string;
  bloqueada?: boolean;
}

function CartaoMontarJogo({ 
  cartela, 
  indice, 
  totalCartelas,
  alternarNumero, 
  salvarCartela, 
  removerCartela, 
  alternarTravaIndividual,
  trocarDiretoPosicao,
  cartelaSelecionadaParaTroca,
  iniciarTroca,
  travaGeralAtiva,
  celulaCartelaStyle,
  gabaritos,
  CORES_GABARITO,
  gabaritoAtivoParaComparacaoId,
  setGabaritoAtivoParaComparacaoId
}: any) {
  const estaTravada = travaGeralAtiva || cartela.bloqueada;
  const estaAguardandoTroca = cartelaSelecionadaParaTroca === indice;
  const [menuGabaritosAberto, setMenuGabaritosAberto] = useState(false);

  const totalEscolhidos = cartela.selecionadas.reduce(
    (acc: number, linha: number[]) => acc + linha.filter(v => v === 1 || v === 2).length,
    0
  );

  const gabaritosComPontos = (gabaritos || []).map((gab: any, idx: number) => {
    const cor = CORES_GABARITO[gab.corIdx];
    let acertos = 0;
    for (let l = 0; l < LINHAS_QTD; l++) {
      for (let c = 0; c < COLUNAS_QTD; c++) {
        const naCartela = cartela.selecionadas[l][c] === 1 || cartela.selecionadas[l][c] === 2;
        const noGabarito = gab.valores[l][c] === 1;
        if (naCartela && noGabarito) acertos++;
      }
    }
    return {
      id: gab.id,
      nome: `G${idx + 1}`,
      cor,
      acertos,
      ehPremiado: acertos >= 15 || acertos === 0,
      valores: gab.valores
    };
  });
  const premiados = gabaritosComPontos.filter((g: any) => g.ehPremiado);
  const melhorGabarito = [...gabaritosComPontos].sort((a, b) => b.acertos - a.acertos)[0];

  return (
    <div 
      style={{
        ...styles.cardPrincipal,
        border: estaAguardandoTroca 
          ? '2px solid #2563eb' 
          : estaTravada 
            ? '1px solid #cbd5e1' 
            : '1px solid #e2e8f0',
        background: estaAguardandoTroca 
          ? '#eff6ff' 
          : '#ffffff',
        boxShadow: estaAguardandoTroca 
          ? '0 0 15px rgba(37, 99, 235, 0.35)' 
          : '0 4px 6px -1px rgba(0,0,0,0.08)',
        transform: estaAguardandoTroca ? 'scale(1.01)' : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            disabled={indice === 0}
            onClick={() => trocarDiretoPosicao(indice, indice - 1)}
            style={{ ...styles.btnMover, opacity: indice === 0 ? 0.3 : 1 }}
            title="Trocar com a cartela anterior"
          >
            ◀
          </button>
          
          <h3 style={styles.cardTitle}>
            CARTELA #{cartela.numeroCartela}
          </h3>

          <button
            type="button"
            disabled={indice === totalCartelas - 1}
            onClick={() => trocarDiretoPosicao(indice, indice + 1)}
            style={{ ...styles.btnMover, opacity: indice === totalCartelas - 1 ? 0.3 : 1 }}
            title="Trocar com a próxima cartela"
          >
            ▶
          </button>

          <button
            type="button"
            onClick={() => iniciarTroca(indice)}
            style={{
              background: estaAguardandoTroca ? '#2563eb' : '#f1f5f9',
              color: estaAguardandoTroca ? '#ffffff' : '#334155',
              border: estaAguardandoTroca ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title={estaAguardandoTroca ? "Cancelar troca" : "Clique aqui e depois noutra cartela para trocar de posição"}
          >
            {estaAguardandoTroca ? 'Cancel ✕' : '⇄ Trocar'}
          </button>

          <button
            type="button"
            onClick={() => alternarTravaIndividual(cartela.id)}
            style={{
              background: estaTravada ? '#fee2e2' : '#f1f5f9',
              color: estaTravada ? '#dc2626' : '#475569',
              border: 'none',
              borderRadius: 4,
              padding: '2px 5px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title={estaTravada ? "Cartela bloqueada contra cliques" : "Travar esta cartela"}
          >
            {estaTravada ? '🔒' : '🔓'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => removerCartela(cartela.id)}
          style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          title="Remover esta cartela"
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 8, fontWeight: 600, color: '#0f172a', fontSize: 13, textAlign: 'center' }}>
        Escolhidos: {totalEscolhidos}
      </div>

      {gabaritosComPontos.length > 0 && (
        <div style={{ width: '100%', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: premiados.length > 0 ? '#ecfdf5' : '#f8fafc',
            border: premiados.length > 0 ? '1px solid #6ee7b7' : '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '3px 6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: premiados.length > 0 ? '#047857' : '#475569' }}>
              <span>{premiados.length > 0 ? `🏆 Premiadas (${premiados.length})` : 'Sem 15+ pts'}</span>
              {melhorGabarito && (
                <span style={{ fontSize: 9, opacity: 0.85 }}>Top: <b>{melhorGabarito.nome} ({melhorGabarito.acertos}p)</b></span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuGabaritosAberto(prev => !prev)}
              style={{
                background: premiados.length > 0 ? '#fef3c7' : '#f1f5f9',
                border: premiados.length > 0 ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 9,
                fontWeight: 800,
                cursor: 'pointer',
                color: premiados.length > 0 ? '#b45309' : '#475569'
              }}
            >
              {menuGabaritosAberto ? '▲ Fechar' : `🏆 ${premiados.length || gabaritosComPontos.length}`}
            </button>
          </div>

          {menuGabaritosAberto && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: 6,
              maxHeight: 95,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: 2 }}>
                Clique no gabarito para iluminar na cartela:
              </div>

              {[...gabaritosComPontos].sort((a, b) => b.acertos - a.acertos).map((g: any) => {
                const estaAtivo = gabaritoAtivoParaComparacaoId === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setGabaritoAtivoParaComparacaoId(estaAtivo ? null : g.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 9,
                      cursor: 'pointer',
                      background: estaAtivo ? g.cor.solido : g.ehPremiado ? '#dcfce7' : '#f8fafc',
                      color: estaAtivo ? '#ffffff' : g.ehPremiado ? '#15803d' : '#475569',
                      border: estaAtivo ? `1px solid ${g.cor.borda}` : '1px solid transparent',
                      fontWeight: g.ehPremiado ? 900 : 600
                    }}
                  >
                    <span>Gabarito {g.nome}</span>
                    <span><b>{g.acertos} pts</b> {g.ehPremiado ? '★' : ''} {estaAtivo ? ' (Ativo)' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{
        ...styles.gradeSelecao,
        pointerEvents: estaTravada ? 'none' : 'auto',
        opacity: estaTravada ? 0.88 : 1,
        userSelect: 'none'
      }}>
        {Array.from({ length: LINHAS_QTD }, (_, linhaIdx) => (
          <div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
            {NUMS.map(num => {
              const estado = cartela.selecionadas[linhaIdx][num - 1];
              const numero = linhaIdx * COLUNAS_QTD + num;
              const gabAtivo = (gabaritos || []).find((g: any) => g.id === gabaritoAtivoParaComparacaoId);
              const corAtiva = gabAtivo ? CORES_GABARITO[gabAtivo.corIdx] : null;
              const acertouNoGabarito = gabAtivo ? gabAtivo.valores[linhaIdx][num - 1] === 1 : false;
              let background = "#ffffff";
              let color = "#334155";
              let border = "1px solid #cbd5e1";
              let boxShadow = 'none';
              let opacity = 1;

              if (estado === 1) {
                background = "#3b82f6";
                color = "#ffffff";
                border = "2px solid #2563eb";
              } else if (estado === 2) {
                background = "#ef4444";
                color = "#ffffff";
                border = "2px solid #b91c1c";
              }

              if (gabaritoAtivoParaComparacaoId !== null) {
                if (estado === 1 || estado === 2) {
                  if (acertouNoGabarito) {
                    background = corAtiva ? corAtiva.solido : '#16a34a';
                    border = `2px solid ${corAtiva ? corAtiva.borda : '#15803d'}`;
                    color = '#ffffff';
                    boxShadow = '0 0 8px rgba(15, 23, 42, 0.35)';
                  } else {
                    background = 'transparent';
                    border = '1px dashed #94a3b8';
                    color = '#64748b';
                    opacity = 1;
                  }
                } else {
                  background = '#ffffff';
                  color = '#e2e8f0';
                  border = '1px solid #f1f5f9';
                }
              }

              return (
                <button
                  key={num}
                  disabled={estaTravada}
                  style={{
                    ...(celulaCartelaStyle || styles.celulaCartela),
                    background,
                    color,
                    border,
                    boxShadow,
                    opacity,
                    cursor: estaTravada ? "default" : "pointer",
                  }}
                  onClick={() => alternarNumero(cartela.id, linhaIdx, num)}
                >
                  {(numero === 100 ? 0 : numero).toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button
        disabled={estaTravada}
        style={{
          ...styles.btnSalvar,
          background: estaTravada ? "#94a3b8" : "#16a34a",
          cursor: estaTravada ? "not-allowed" : "pointer"
        }}
        onClick={() => salvarCartela(cartela.id)}
      >
        {estaTravada ? "CARTELA TRAVADA" : "SALVAR"}
      </button>
      {cartela.msg && <div style={{ color: '#16a34a', marginTop: 6, fontWeight: 600, fontSize: 12, textAlign: 'center' }}>{cartela.msg}</div>}
    </div>
  );
}

export default function Gerador() {
  const [montado, setMontado] = useState(false);
  const [salvos, setSalvos] = useState<number[][][]>([]);
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [cartelaEditTemp, setCartelaEditTemp] = useState<number[][] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gabaritos, setGabaritos] = useState<Gabarito5x20[]>([]);
  const [gabaritoAtivoParaComparacaoId, setGabaritoAtivoParaComparacaoId] = useState<number | null>(null);
  const [relatorioGeralAberto, setRelatorioGeralAberto] = useState(false);
  const [travaGeral, setTravaGeral] = useState(false);
  const [cartelasFixas, setCartelasFixas] = useState<CartelaFixa5x20Item[]>([]);

  const [gabExpandidoId, setGabExpandidoId] = useState<number | null>(null);
  const [cartelaSelecionadaParaTroca, setCartelaSelecionadaParaTroca] = useState<number | null>(null);

  // Estados do Raio-X e Controlo Tático
  const [painelRaioXAberto, setPainelRaioXAberto] = useState(false);
  const [raioXPos, setRaioXPos] = useState({ x: 40, y: 100 });
  const [qtdVacuoTopo, setQtdVacuoTopo] = useState<number>(3);
  const [qtdVacuoBase, setQtdVacuoBase] = useState<number>(4);
  const [qtdGabaritosParaGerar, setQtdGabaritosParaGerar] = useState<number>(10);
  const [tipoDivisaoVacuo, setTipoDivisaoVacuo] = useState<'livre' | 'bipolar'>('livre');
  const [qtdVacuoTotalLivre, setQtdVacuoTotalLivre] = useState<number>(7);
  // Lista de faixas autorizadas (se vazia, todas da zona são autorizadas)
  const [faixasCandidatasTopo, setFaixasCandidatasTopo] = useState<number[]>([]);
  const [faixasCandidatasBase, setFaixasCandidatasBase] = useState<number[]>([]);
  const [modoSelecaoFaixas, setModoSelecaoFaixas] = useState<'auto_fracas' | 'manual_selecionadas'>('manual_selecionadas');

  const gerarGradeVazia = () => Array(LINHAS_QTD).fill(0).map(() => Array(COLUNAS_QTD).fill(0));

  const relatorioAuditoriaGeral = useMemo(() => {
    if (gabaritos.length === 0 || cartelasFixas.length === 0) return null;

    const faixasPontos: Record<number, number> = {
      20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 14: 0, 0: 0
    };

    let melhorAcertoGeral = 0;
    let campeao = { gabaritoNome: '', cartelaNumero: 0, acertos: 0 };

    const detalhePorCartela = cartelasFixas.map((cartela) => {
      let melhorDestaCartela = 0;
      let gabaritoMelhorNome = '';
      const acertosPorGabarito: { gabNome: string; acertos: number }[] = [];

      gabaritos.forEach((gab, gIdx) => {
        let acertos = 0;
        for (let l = 0; l < LINHAS_QTD; l++) {
          for (let c = 0; c < COLUNAS_QTD; c++) {
            const naCartela = cartela.selecionadas[l][c] === 1 || cartela.selecionadas[l][c] === 2;
            const noGab = gab.valores[l][c] === 1;
            if (naCartela && noGab) acertos++;
          }
        }

        acertosPorGabarito.push({ gabNome: `G${gIdx + 1}`, acertos });

        if (faixasPontos[acertos] !== undefined) {
          faixasPontos[acertos]++;
        }

        if (acertos > melhorDestaCartela) {
          melhorDestaCartela = acertos;
          gabaritoMelhorNome = `G${gIdx + 1}`;
        }

        if (acertos > melhorAcertoGeral) {
          melhorAcertoGeral = acertos;
          campeao = { gabaritoNome: `G${gIdx + 1}`, cartelaNumero: cartela.numeroCartela, acertos };
        }
      });

      return {
        numeroCartela: cartela.numeroCartela,
        melhorAcerto: melhorDestaCartela,
        melhorGabarito: gabaritoMelhorNome,
        acertosPorGabarito
      };
    });

    return {
      faixasPontos,
      campeao,
      detalhePorCartela: detalhePorCartela.sort((a, b) => b.melhorAcerto - a.melhorAcerto),
      totalCartelas: cartelasFixas.length,
      totalGabaritos: gabaritos.length
    };
  }, [gabaritos, cartelasFixas]);

  useEffect(() => {
    const fixasSalvas = localStorage.getItem(STORAGE_CARTELAS_FIXAS_KEY);
    if (fixasSalvas) {
      const parsed: CartelaFixa5x20Item[] = JSON.parse(fixasSalvas);
      const migradas = parsed.map((c, i) => ({
        ...c,
        numeroCartela: c.numeroCartela || (i + 1)
      }));
      setCartelasFixas(migradas);
    } else {
      setCartelasFixas([
        { id: 1, numeroCartela: 1, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
        { id: 2, numeroCartela: 2, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
        { id: 3, numeroCartela: 3, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
        { id: 4, numeroCartela: 4, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false },
      ]);
    }

    const s = localStorage.getItem(STORAGE_CARTELAS_SALVAS_KEY);
    if (s) setSalvos(JSON.parse(s));

    const gSalvos = localStorage.getItem(STORAGE_GABARITOS_KEY);
    if (gSalvos) setGabaritos(JSON.parse(gSalvos));

    const travaSalva = localStorage.getItem(STORAGE_TRAVA_GERAL_KEY);
    if (travaSalva) setTravaGeral(JSON.parse(travaSalva));
    
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    handleResize();
    window.addEventListener('resize', handleResize);
    setMontado(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_CARTELAS_FIXAS_KEY, JSON.stringify(cartelasFixas));
  }, [cartelasFixas, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_CARTELAS_SALVAS_KEY, JSON.stringify(salvos));
  }, [salvos, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_GABARITOS_KEY, JSON.stringify(gabaritos));
  }, [gabaritos, montado]);

  useEffect(() => {
    if (montado) localStorage.setItem(STORAGE_TRAVA_GERAL_KEY, JSON.stringify(travaGeral));
  }, [travaGeral, montado]);

  const alternarTravaGeral = () => setTravaGeral(prev => !prev);

  const alternarTravaIndividual = (id: number) => {
    setCartelasFixas(prev => prev.map(c => 
      c.id === id ? { ...c, bloqueada: !c.bloqueada } : c
    ));
  };

  const trocarDiretoPosicao = (origemIdx: number, destinoIdx: number) => {
    if (destinoIdx < 0 || destinoIdx >= cartelasFixas.length || origemIdx === destinoIdx) return;
    setCartelasFixas(prev => {
      const nova = [...prev];
      const temp = nova[origemIdx];
      nova[origemIdx] = nova[destinoIdx];
      nova[destinoIdx] = temp;
      return nova;
    });
  };

  const iniciarOuExecutarTroca = (indiceClicado: number) => {
    if (cartelaSelecionadaParaTroca === null) {
      setCartelaSelecionadaParaTroca(indiceClicado);
    } else if (cartelaSelecionadaParaTroca === indiceClicado) {
      setCartelaSelecionadaParaTroca(null);
    } else {
      trocarDiretoPosicao(cartelaSelecionadaParaTroca, indiceClicado);
      setCartelaSelecionadaParaTroca(null);
    }
  };

  const getFaixasVazias = (grade: number[][]) => {
    const vazias: number[] = [];
    grade.forEach((linha, lIdx) => {
      const temNumero = linha.some(v => v === 1 || v === 2);
      if (!temNumero) vazias.push(lIdx);
    });
    return vazias;
  };

  const agruparPorSimilaridadeDeFalhas = () => {
    if (cartelasFixas.length <= 1) return;

    const lista = [...cartelasFixas];
    const ordenadas: CartelaFixa5x20Item[] = [];
    
    let atual = lista.shift()!;
    ordenadas.push(atual);

    while (lista.length > 0) {
      const vaziasAtual = getFaixasVazias(atual.selecionadas);
      let melhorIndice = 0;
      let maiorCoincidencia = -1;

      lista.forEach((candidata, idx) => {
        const vaziasCandidata = getFaixasVazias(candidata.selecionadas);
        const coincidencia = vaziasAtual.filter(f => vaziasCandidata.includes(f)).length;
        if (coincidencia > maiorCoincidencia) {
          maiorCoincidencia = coincidencia;
          melhorIndice = idx;
        }
      });

      atual = lista.splice(melhorIndice, 1)[0];
      ordenadas.push(atual);
    }

    setCartelasFixas(ordenadas);
  };

  const ordenarCartelasPor = (tipo: 'topo' | 'base' | 'qtdVazias' | 'numero') => {
    setCartelasFixas(prev => {
      const copia = [...prev];
      if (tipo === 'numero') {
        return copia.sort((a, b) => a.numeroCartela - b.numeroCartela);
      }
      if (tipo === 'qtdVazias') {
        return copia.sort((a, b) => getFaixasVazias(b.selecionadas).length - getFaixasVazias(a.selecionadas).length);
      }
      if (tipo === 'topo') {
        return copia.sort((a, b) => {
          const scoreA = getFaixasVazias(a.selecionadas).filter(l => l >= 10).length;
          const scoreB = getFaixasVazias(b.selecionadas).filter(l => l >= 10).length;
          return scoreB - scoreA;
        });
      }
      if (tipo === 'base') {
        return copia.sort((a, b) => {
          const scoreA = getFaixasVazias(a.selecionadas).filter(l => l < 10).length;
          const scoreB = getFaixasVazias(b.selecionadas).filter(l => l < 10).length;
          return scoreB - scoreA;
        });
      }
      return copia;
    });
  };

  const adicionarCartelaFixa = () => {
    setCartelasFixas(prev => {
      const maiorNum = prev.reduce((max, c) => Math.max(max, c.numeroCartela || 0), 0);
      return [
        ...prev,
        { id: Date.now(), numeroCartela: maiorNum + 1, selecionadas: gerarGradeVazia(), msg: "", bloqueada: false }
      ];
    });
  };

  const removerCartelaFixa = (id: number) => {
    if (cartelasFixas.length <= 1) {
      alert("Mantenha ao menos 1 cartela fixa!");
      return;
    }
    setCartelasFixas(prev => prev.filter(c => c.id !== id));
  };

  const alternarNumeroCartelaFixa = (id: number, linhaIdx: number, num: number) => {
    setCartelasFixas(prev => prev.map(cartela => {
      if (cartela.id !== id) return cartela;
      const idx = num - 1;
      const novaGrade = cartela.selecionadas.map((linha, lIdx) => {
        if (lIdx !== linhaIdx) return linha;
        const novaLinha = [...linha];
        novaLinha[idx] = (novaLinha[idx] + 1) % 3;
        return novaLinha;
      });
      return { ...cartela, selecionadas: novaGrade, msg: "" };
    }));
  };

  const salvarCartelaFixa = (id: number) => {
    const cartela = cartelasFixas.find(c => c.id === id);
    if (!cartela) return;

    const jaSalvo = salvos.some(s => JSON.stringify(s) === JSON.stringify(cartela.selecionadas));
    if (jaSalvo) {
      setCartelasFixas(prev => prev.map(c => c.id === id ? { ...c, msg: "⚠️ Já foi salva!" } : c));
      return;
    }

    const novosSalvos = [cartela.selecionadas.map(l => [...l]), ...salvos];
    setSalvos(novosSalvos);

    setCartelasFixas(prev => prev.map(c => {
      if (c.id !== id) return c;
      const resetComFixos = c.selecionadas.map(linha => linha.map(v => (v === 2 ? 2 : 0)));
      return { ...c, selecionadas: resetComFixos, msg: "Salva com sucesso!" };
    }));
  };

  const arrastoRef = useRef<{ id: number | null; startX: number; startY: number; origemX: number; origemY: number }>({
    id: null, startX: 0, startY: 0, origemX: 0, origemY: 0,
  });

  const arrastoRaioXRef = useRef<{ ativo: boolean; startX: number; startY: number; origemX: number; origemY: number }>({
    ativo: false, startX: 0, startY: 0, origemX: 0, origemY: 0,
  });

  useEffect(() => {
    const aoMoverRato = (e: MouseEvent) => {
      if (arrastoRef.current.id !== null) {
        const { id, startX, startY, origemX, origemY } = arrastoRef.current;
        setGabaritos((anteriores) =>
          anteriores.map((gab) => {
            if (gab.id !== id) return gab;
            return { ...gab, x: Math.max(10, origemX + (e.clientX - startX)), y: Math.max(10, origemY + (e.clientY - startY)) };
          })
        );
      }

      if (arrastoRaioXRef.current.ativo) {
        const { startX, startY, origemX, origemY } = arrastoRaioXRef.current;
        setRaioXPos({
          x: Math.max(10, origemX + (e.clientX - startX)),
          y: Math.max(10, origemY + (e.clientY - startY))
        });
      }
    };

    const aoSoltarRato = () => { 
      arrastoRef.current.id = null;
      arrastoRaioXRef.current.ativo = false;
    };

    window.addEventListener('mousemove', aoMoverRato);
    window.addEventListener('mouseup', aoSoltarRato);
    return () => {
      window.removeEventListener('mousemove', aoMoverRato);
      window.removeEventListener('mouseup', aoSoltarRato);
    };
  }, []);

  const iniciarArrastoGabarito = (e: React.MouseEvent, gab: Gabarito5x20) => {
    arrastoRef.current = { id: gab.id, startX: e.clientX, startY: e.clientY, origemX: gab.x, origemY: gab.y };
  };

  const iniciarArrastoRaioX = (e: React.MouseEvent) => {
    arrastoRaioXRef.current = {
      ativo: true,
      startX: e.clientX,
      startY: e.clientY,
      origemX: raioXPos.x,
      origemY: raioXPos.y
    };
  };

  const adicionarGabarito = () => {
    const novo: Gabarito5x20 = {
      id: Date.now(),
      x: 120 + (gabaritos.length % 4) * 30,
      y: 90 + (gabaritos.length % 4) * 30,
      valores: gerarGradeVazia(),
      corIdx: gabaritos.length % CORES_GABARITO.length,
    };
    setGabaritos((prev) => [...prev, novo]);
  };

  const limparTodosGabaritos = () => {
    if (gabaritos.length === 0) return;
    if (window.confirm(`Tem a certeza que deseja apagar todos os ${gabaritos.length} gabaritos?`)) {
      setGabaritos([]);
      localStorage.removeItem(STORAGE_GABARITOS_KEY);
      setGabaritoAtivoParaComparacaoId(null);
      setGabExpandidoId(null);
    }
  };

  const alternarNumeroGabarito = (idGabarito: number, linhaIdx: number, numIdx: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) => {
        if (gab.id !== idGabarito) return gab;
        const novosValores = gab.valores.map((linha, lIdx) =>
          lIdx === linhaIdx ? linha.map((val, nIdx) => (nIdx === numIdx ? (val === 0 ? 1 : 0) : val)) : [...linha]
        );
        return { ...gab, valores: novosValores };
      })
    );
  };

  const limparGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) =>
      anteriores.map((gab) => gab.id === idGabarito ? { ...gab, valores: gerarGradeVazia() } : gab)
    );
  };

  const excluirGabarito = (idGabarito: number) => {
    setGabaritos((anteriores) => anteriores.filter((gab) => gab.id !== idGabarito));
  };

  const alternarNumeroEdit = (linhaIdx: number, idx2: number) => {
    setCartelaEditTemp(prev => prev!.map((linha, i) => {
      if (i !== linhaIdx) return linha;
      const novoArr = [...linha];
      novoArr[idx2] = (novoArr[idx2] + 1) % 3;
      return novoArr;
    }));
  };

  // Estatísticas de dezenas
  const estatisticas100 = useMemo(() => {
    const contadores: number[] = Array(100).fill(0);

    cartelasFixas.forEach(cartela => {
      cartela.selecionadas.forEach((linha, lIdx) => {
        linha.forEach((val, cIdx) => {
          if (val === 1 || val === 2) {
            const numero = lIdx * COLUNAS_QTD + cIdx + 1;
            contadores[numero - 1] += 1;
          }
        });
      });
    });

    salvos.forEach(grade => {
      grade.forEach((linha, lIdx) => {
        linha.forEach((val, cIdx) => {
          if (val === 1 || val === 2) {
            const numero = lIdx * COLUNAS_QTD + cIdx + 1;
            contadores[numero - 1] += 1;
          }
        });
      });
    });

    const lista = contadores.map((qtd, idx) => {
      const numReal = idx + 1;
      const formatado = (numReal === 100 ? 0 : numReal).toString().padStart(2, "0");
      return { numero: formatado, valorBruto: numReal, qtd };
    });

    const ordenadosPorUso = [...lista].sort((a, b) => b.qtd - a.qtd);
    const naoUsados = lista.filter(item => item.qtd === 0);
    const maxQtd = Math.max(...contadores, 1);

    return { lista, ordenadosPorUso, naoUsados, maxQtd, totalJogos: cartelasFixas.length + salvos.length };
  }, [cartelasFixas, salvos]);

  // Estatísticas das 20 faixas horizontais
  const estatisticasFaixasHorizontais = useMemo(() => {
    const contagemLinhas = Array(LINHAS_QTD).fill(0);

    const todas = [
      ...cartelasFixas.map(c => c.selecionadas),
      ...salvos
    ];

    todas.forEach(grade => {
      grade.forEach((linha, lIdx) => {
        linha.forEach((val) => {
          if (val === 1 || val === 2) {
            contagemLinhas[lIdx] += 1;
          }
        });
      });
    });

    const faixas = contagemLinhas.map((qtd, linhaIdx) => {
      const inicio = linhaIdx * COLUNAS_QTD + 1;
      const fim = (linhaIdx + 1) * COLUNAS_QTD;
      const inicioFmt = (inicio === 100 ? 0 : inicio).toString().padStart(2, "0");
      const fimFmt = (fim === 100 ? 0 : fim).toString().padStart(2, "0");
      return {
        linhaIdx,
        rotulo: `${inicioFmt}-${fimFmt}`,
        qtd
      };
    });

    return { faixas };
  }, [cartelasFixas, salvos]);

  const frequenciasBancada = useMemo(() => {
    const pesoFaixa = Array(20).fill(0);
    const freqDezena = Array(100).fill(0);

    cartelasFixas.forEach(cartela => {
      cartela.selecionadas.forEach((linha, faixaIdx) => {
        linha.forEach((valor, colunaIdx) => {
          if (valor === 1 || valor === 2) {
            pesoFaixa[faixaIdx] += 1;
            freqDezena[faixaIdx * COLUNAS_QTD + colunaIdx] += 1;
          }
        });
      });
    });

    return { pesoFaixa, freqDezena };
  }, [cartelasFixas]);

  // Controlo de clique individual para selecionar faixas autorizadas
  const alternarFaixaCandidata = (faixa: number) => {
    if (faixa < 10) {
      setFaixasCandidatasTopo(prev => 
        prev.includes(faixa) ? prev.filter(f => f !== faixa) : [...prev, faixa].sort((a, b) => a - b)
      );
    } else {
      setFaixasCandidatasBase(prev => 
        prev.includes(faixa) ? prev.filter(f => f !== faixa) : [...prev, faixa].sort((a, b) => a - b)
      );
    }
  };

  const alternarDezenaNoGabaritoAtivo = (valorBruto: number) => {
    let gabAlvoId: number;

    if (gabaritos.length === 0) {
      const novoId = Date.now();
      const novo: Gabarito5x20 = {
        id: novoId,
        x: 180,
        y: 100,
        valores: gerarGradeVazia(),
        corIdx: 0,
      };
      setGabaritos([novo]);
      gabAlvoId = novoId;
    } else {
      gabAlvoId = gabaritos[gabaritos.length - 1].id;
    }

    const linhaIdx = Math.floor((valorBruto - 1) / COLUNAS_QTD);
    const colIdx = (valorBruto - 1) % COLUNAS_QTD;

    setGabaritos(prev => prev.map(gab => {
      if (gab.id !== gabAlvoId) return gab;
      const novosValores = gab.valores.map((linha, lIdx) =>
        lIdx === linhaIdx
          ? linha.map((val, cIdx) => (cIdx === colIdx ? (val === 0 ? 1 : 0) : val))
          : [...linha]
      );
      return { ...gab, valores: novosValores };
    }));
  };

  const faixasMarcadas = [...faixasCandidatasTopo, ...faixasCandidatasBase];
  const poolCorte = faixasMarcadas.length > 0
    ? Array.from(new Set(faixasMarcadas)).sort((a, b) => a - b)
    : Array.from({ length: 20 }, (_, i) => i);

  const exportarTopParaGabarito = () => {
    const shuffle = <T,>(arr: T[]): T[] => {
      const c = [...arr];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    };

    const novosGabaritos: Gabarito5x20[] = [];
    const idBase = Date.now();

    for (let i = 0; i < qtdGabaritosParaGerar; i++) {
      // Todas as faixas verdes selecionadas são proibidas neste gabarito.
      const faixasVazias = [...poolCorte];
      const setVazias = new Set(faixasVazias);

      const faixasAtivas: number[] = [];
      for (let l = 0; l < 20; l++) {
        if (!setVazias.has(l)) {
          faixasAtivas.push(l);
        }
      }

      const dezenasDisponiveis = faixasAtivas.flatMap(linha =>
        Array.from({ length: COLUNAS_QTD }, (_, coluna) => linha * COLUNAS_QTD + coluna)
      );

      if (dezenasDisponiveis.length < 50) {
        alert('As faixas brancas disponíveis não somam 50 dezenas. Selecione exatamente 10 faixas verdes.');
        return;
      }

      const grade = Array(20).fill(0).map(() => Array(5).fill(0));
      const dezenasSorteadas = dezenasDisponiveis.length === 50
        ? dezenasDisponiveis
        : shuffle(dezenasDisponiveis).slice(0, 50);

      dezenasSorteadas.forEach(dezena => {
        const linha = Math.floor(dezena / 5);
        const coluna = dezena % 5;
        if (!setVazias.has(linha)) {
          grade[linha][coluna] = 1;
        }
      });

      novosGabaritos.push({
        id: idBase + i,
        x: 130 + ((gabaritos.length + i) % 5) * 30,
        y: 100 + ((gabaritos.length + i) % 5) * 30,
        valores: grade,
        corIdx: (gabaritos.length + i) % CORES_GABARITO.length
      });
    }

    setGabaritos(prev => [...prev, ...novosGabaritos]);
  };
  const auditarGabaritoContraCartelas = (gabValores: number[][]) => {
    const resultados: { numeroCartela: number; acertos: number; ehPremiada: boolean }[] = [];

    const totalMarcadosNoGabarito = gabValores.reduce(
      (acc, linha) => acc + linha.filter(v => v === 1).length,
      0
    );

    if (totalMarcadosNoGabarito < 15) {
      return { totalAuditadas: 0, resultados: [], premiadas: [] };
    }

    cartelasFixas.forEach(c => {
      let acertos = 0;
      let marcadasNaCartela = 0;

      for (let l = 0; l < LINHAS_QTD; l++) {
        for (let col = 0; col < COLUNAS_QTD; col++) {
          const naCartela = c.selecionadas[l][col] === 1 || c.selecionadas[l][col] === 2;
          const noGabarito = gabValores[l][col] === 1;

          if (naCartela) marcadasNaCartela++;
          if (naCartela && noGabarito) acertos++;
        }
      }

      if (marcadasNaCartela >= 15) {
        const ehPremiada = acertos >= 15 || (acertos === 0 && totalMarcadosNoGabarito >= 20);
        resultados.push({
          numeroCartela: c.numeroCartela,
          acertos,
          ehPremiada
        });
      }
    });

    const premiadas = resultados
      .filter(r => r.ehPremiada)
      .sort((a, b) => b.acertos - a.acertos);

    return { totalAuditadas: resultados.length, resultados, premiadas };
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
      
      {/* ALERTA DE TROCA DE POSIÇÃO */}
      {cartelaSelecionadaParaTroca !== null && (
        <div style={styles.alertaTrocaAtiva}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⇄</span>
            <span>
              Cartela <b>#{cartelasFixas[cartelaSelecionadaParaTroca]?.numeroCartela}</b> selecionada! Role e clique no botão <b>[⇄ Trocar]</b> de qualquer outra cartela.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCartelaSelecionadaParaTroca(null)}
            style={styles.btnCancelarTroca}
          >
            Cancelar Troca ✕
          </button>
        </div>
      )}

      {/* PAINEL FLUTUANTE DO RAIO-X COM CONTROLO TÁTICO COMPLETO */}
      {painelRaioXAberto && (
        <div style={{
          ...styles.janelaFlutuanteRaioX,
          left: isMobile ? 10 : raioXPos.x,
          top: isMobile ? 10 : raioXPos.y,
          width: isMobile ? '95%' : 640,
        }}>
          <div 
            onMouseDown={iniciarArrastoRaioX}
            style={styles.alcaJanelaFlutuante}
            title="Clique e arraste para mover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>✥</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>
                PAINEL TÁTICO • CONTROLO LIVRE DE VÁCUOS E FAIXAS
              </span>
            </div>
            <button 
              onClick={() => setPainelRaioXAberto(false)} 
              style={styles.btnFecharFlutuante}
            >
              ✕
            </button>
          </div>

          <div style={styles.corpoFlutuante}>
            
            {/* SELEÇÃO DAS FAIXAS AUTORIZADAS PARA VÁCUO */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#1e293b' }}>
                  🎯 CLIQUE NAS FAIXAS ONDE O VÁCUO PODE ATUAR:
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFaixasCandidatasTopo([]);
                      setFaixasCandidatasBase([]);
                    }}
                    style={styles.btnAutoTrava}
                  >
                    ↺ Resetar (Todas Livres)
                  </button>
                </div>
              </div>

              {/* Grid Topo (01-50) */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: 3 }}>
                  Parte Superior (Faixas 0 a 9 | Dezenas 01 a 50) — {faixasCandidatasTopo.length === 0 ? "Todas as 10 autorizadas" : `${faixasCandidatasTopo.length} selecionadas`}:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3 }}>
                  {estatisticasFaixasHorizontais.faixas.slice(0, 10).map((f) => {
                    const selecionada = faixasCandidatasTopo.includes(f.linhaIdx);
                    return (
                      <button
                        key={f.linhaIdx}
                        type="button"
                        onClick={() => alternarFaixaCandidata(f.linhaIdx)}
                        style={{
                          background: selecionada ? '#10b981' : '#f1f5f9',
                          color: selecionada ? '#ffffff' : '#334155',
                          border: selecionada ? '2px solid #059669' : '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '4px 2px',
                          fontSize: 9,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                        title={`Faixa [${f.rotulo}]: ${f.qtd} dezenas na bancada. Clique para ${selecionada ? 'remover' : 'incluir'} no rodízio de vácuo`}
                      >
                        <span>{f.rotulo}</span>
                        <span style={{ fontSize: 8, opacity: 0.9 }}>{f.qtd}x</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid Base (51-00) */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#b45309', display: 'block', marginBottom: 3 }}>
                  Parte Inferior (Faixas 10 a 19 | Dezenas 51 a 00) — {faixasCandidatasBase.length === 0 ? "Todas as 10 autorizadas" : `${faixasCandidatasBase.length} selecionadas`}:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3 }}>
                  {estatisticasFaixasHorizontais.faixas.slice(10, 20).map((f) => {
                    const selecionada = faixasCandidatasBase.includes(f.linhaIdx);
                    return (
                      <button
                        key={f.linhaIdx}
                        type="button"
                        onClick={() => alternarFaixaCandidata(f.linhaIdx)}
                        style={{
                          background: selecionada ? '#10b981' : '#f1f5f9',
                          color: selecionada ? '#ffffff' : '#334155',
                          border: selecionada ? '2px solid #059669' : '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '4px 2px',
                          fontSize: 9,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                        title={`Faixa [${f.rotulo}]: ${f.qtd} dezenas na bancada. Clique para ${selecionada ? 'remover' : 'incluir'} no rodízio de vácuo`}
                      >
                        <span>{f.rotulo}</span>
                        <span style={{ fontSize: 8, opacity: 0.9 }}>{f.qtd}x</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          {/* CONTROLES DE QUANTIDADES DINÂMICAS */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>
                    ⚙️ Distribuição do Vácuo:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTipoDivisaoVacuo(prev => prev === 'livre' ? 'bipolar' : 'livre')}
                    style={{
                      background: tipoDivisaoVacuo === 'livre' ? '#e0f2fe' : '#fef3c7',
                      color: tipoDivisaoVacuo === 'livre' ? '#0369a1' : '#b45309',
                      border: tipoDivisaoVacuo === 'livre' ? '1px solid #38bdf8' : '1px solid #f59e0b',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {tipoDivisaoVacuo === 'livre' ? '🎯 Modo Livre (Toda a Cartela)' : '⚖️ Modo Bipolar (Topo + Base)'}
                  </button>
                </div>

                <span style={{ fontSize: 11, fontWeight: 900, color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: 6 }}>
                  Total de Vácuos: {tipoDivisaoVacuo === 'livre' ? qtdVacuoTotalLivre : (qtdVacuoTopo + qtdVacuoBase)} faixas
                </span>
              </div>

              {/* Controles Dinâmicos dependendo do Modo Escolhido */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {tipoDivisaoVacuo === 'livre' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Quantos Vácuos no Total:</span>
                    <button type="button" onClick={() => setQtdVacuoTotalLivre(p => Math.max(1, p - 1))} style={styles.btnAcaoMini}>−</button>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={qtdVacuoTotalLivre}
                      onChange={(e) => setQtdVacuoTotalLivre(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                      style={{ width: 44, padding: '3px', textAlign: 'center', fontWeight: 800, borderRadius: 4, border: '1px solid #cbd5e1' }}
                    />
                    <button type="button" onClick={() => setQtdVacuoTotalLivre(p => Math.min(10, p + 1))} style={styles.btnAcaoMini}>+</button>
                    <span style={{ fontSize: 10, color: '#64748b' }}>
                      (sorteando entre as {(faixasCandidatasTopo.length + faixasCandidatasBase.length) || 20} faixas autorizadas)
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Vácuos no Topo:</span>
                      <button type="button" onClick={() => setQtdVacuoTopo(p => Math.max(0, p - 1))} style={styles.btnAcaoMini}>−</button>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={qtdVacuoTopo}
                        onChange={(e) => setQtdVacuoTopo(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                        style={{ width: 44, padding: '3px', textAlign: 'center', fontWeight: 800, borderRadius: 4, border: '1px solid #cbd5e1' }}
                      />
                      <button type="button" onClick={() => setQtdVacuoTopo(p => Math.min(10, p + 1))} style={styles.btnAcaoMini}>+</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Vácuos na Base:</span>
                      <button type="button" onClick={() => setQtdVacuoBase(p => Math.max(0, p - 1))} style={styles.btnAcaoMini}>−</button>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={qtdVacuoBase}
                        onChange={(e) => setQtdVacuoBase(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                        style={{ width: 44, padding: '3px', textAlign: 'center', fontWeight: 800, borderRadius: 4, border: '1px solid #cbd5e1' }}
                      />
                      <button type="button" onClick={() => setQtdVacuoBase(p => Math.min(10, p + 1))} style={styles.btnAcaoMini}>+</button>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Qtd Gabaritos:</span>
                  <input
                    type="number"
                    min={1}
                    value={qtdGabaritosParaGerar}
                    onChange={(e) => setQtdGabaritosParaGerar(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width: 55, padding: '3px', textAlign: 'center', fontWeight: 800, borderRadius: 4, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>Seleção:</span>
                  <select
                    value={modoSelecaoFaixas}
                    onChange={(e) => setModoSelecaoFaixas(e.target.value as any)}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 800 }}
                  >
                    <option value="manual_selecionadas">Sorteio Livre nas Faixas Clicadas</option>
                    <option value="auto_fracas">Priorizar as Mais Fracas da Bancada</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={exportarTopParaGabarito}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  ⚡ Gerar {qtdGabaritosParaGerar} Gabarito(s)
                </button>
              </div>
            </div>

            {/* Mapa 10x10 de Dezenas */}
            <div style={styles.gridMapaCalorFlutuante}>
              {estatisticas100.lista.map(item => {
                const linhaDaDezena = Math.floor((item.valorBruto - 1) / COLUNAS_QTD);
                const semUso = item.qtd === 0;
                const maisUsado = item.qtd >= estatisticas100.maxQtd && item.qtd > 1;

                return (
                  <button
                    key={item.numero}
                    type="button"
                    onClick={() => alternarDezenaNoGabaritoAtivo(item.valorBruto)}
                    title={`Dezena ${item.numero} (${item.qtd}x). Clique para marcar no último Gabarito`}
                    style={{
                      ...styles.celulaMapaFlutuante,
                      background: semUso ? '#f8fafc' : maisUsado ? '#dcfce7' : '#e0f2fe',
                      borderColor: semUso ? '#e2e8f0' : maisUsado ? '#86efac' : '#bae6fd',
                      opacity: semUso ? 0.45 : 1,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: semUso ? '#94a3b8' : maisUsado ? '#15803d' : '#0369a1' }}>
                      {item.numero}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 800, color: semUso ? '#94a3b8' : maisUsado ? '#166534' : '#1e40af' }}>
                      {item.qtd}x
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Camada dos Gabaritos Flutuantes */}
      {gabaritos.map((gab, idx) => {
        const cor = CORES_GABARITO[gab.corIdx];
        const marcadosNoGabarito = gab.valores.reduce(
          (acc, linha) => acc + linha.filter(v => v > 0).length,
          0
        );

        const auditoria = auditarGabaritoContraCartelas(gab.valores);
        const estaExpandido = gabExpandidoId === gab.id;

        return (
          <div
            key={gab.id}
            style={{
              ...styles.gabaritoContainer,
              left: gab.x,
              top: gab.y,
              border: `2px dashed ${cor.borda}`,
            }}
          >
            {/* Alça do Gabarito */}
            <div
              onMouseDown={(e) => iniciarArrastoGabarito(e, gab)}
              style={styles.alcaGabarito}
              title="Clique e arraste para movimentar"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: cor.borda }}>G{idx + 1}</span>
                <span style={styles.badgeContadorGabarito}>{marcadosNoGabarito}</span>
              </div>

              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setGabExpandidoId(prev => prev === gab.id ? null : gab.id)}
                  style={{
                    background: auditoria.premiadas.length > 0 ? '#fef3c7' : '#f1f5f9',
                    border: auditoria.premiadas.length > 0 ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: 9,
                    fontWeight: 800,
                    cursor: 'pointer',
                    color: auditoria.premiadas.length > 0 ? '#b45309' : '#475569'
                  }}
                  title="Ver auditoria detalhada"
                >
                  {estaExpandido ? "▲ Fechar" : `🏆 ${auditoria.premiadas.length}`}
                </button>

                {marcadosNoGabarito > 0 && (
                  <button type="button" onClick={() => limparGabarito(gab.id)} style={styles.btnAcaoMini} title="Limpar">↺</button>
                )}
                <button type="button" onClick={() => excluirGabarito(gab.id)} style={{ ...styles.btnAcaoMini, color: '#dc2626' }} title="Fechar">×</button>
              </div>
            </div>

            {/* Selo de Premiação Instantâneo */}
            <div style={{
              width: '100%',
              background: auditoria.premiadas.length > 0 ? '#ecfdf5' : '#ffffff',
              border: auditoria.premiadas.length > 0 ? '1px solid #6ee7b7' : '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '4px 6px',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              pointerEvents: 'auto'
            }}>
              {auditoria.premiadas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#047857' }}>
                    <span>🏆 <b>PREMIADAS ({auditoria.premiadas.length})</b></span>
                    <span style={{ fontSize: 9, color: '#065f46' }}>Top: <b>{auditoria.premiadas[0].acertos} pts</b></span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxHeight: 40, overflowY: 'auto' }}>
                    {auditoria.premiadas.map((prem, pIdx) => (
                      <span
                        key={pIdx}
                        style={{
                          background: prem.acertos === 20 || prem.acertos === 0 ? '#fef08a' : prem.acertos >= 17 ? '#bbf7d0' : '#dcfce7',
                          color: prem.acertos === 20 || prem.acertos === 0 ? '#854d0e' : prem.acertos >= 17 ? '#15803d' : '#166534',
                          border: prem.acertos === 20 || prem.acertos === 0 ? '1px solid #eab308' : '1px solid #86efac',
                          padding: '1px 4px',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 900
                        }}
                      >
                        #{prem.numeroCartela}: {prem.acertos}p
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', fontSize: 9 }}>
                  Nenhuma cartela com 15+ ou 0 pts
                </div>
              )}

              {estaExpandido && (
                <div style={{
                  marginTop: 4,
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: 4,
                  maxHeight: 120,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: '#1e293b' }}>
                    Varredura das Cartelas Fixas:
                  </div>
                  {auditoria.resultados.map((res, rIdx) => (
                    <div
                      key={rIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 9,
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: res.ehPremiada ? '#dcfce7' : '#f8fafc',
                        color: res.ehPremiada ? '#15803d' : '#475569',
                        fontWeight: res.ehPremiada ? 800 : 500
                      }}
                    >
                      <span>Cartela #{res.numeroCartela}</span>
                      <span><b>{res.acertos} pts</b> {res.ehPremiada && '★'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Matriz Visual do Gabarito */}
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

      {/* Barra de Topo */}
      <div style={styles.topoAcoesBar}>
        <button style={styles.btnVoltar} onClick={() => window.location.href = '/'}>
          ⬅ Voltar para Painel
        </button>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPainelRaioXAberto(prev => !prev)}
            style={{
              ...styles.btnRaioX,
              background: painelRaioXAberto ? '#0369a1' : '#0284c7',
            }}
            title="Abrir painel flutuante tático"
          >
            {painelRaioXAberto ? "📊 Fechar Raio-X" : "📊 Abrir Raio-X Flutuante"}
          </button>

          <button
            type="button"
            onClick={alternarTravaGeral}
            style={{
              ...styles.btnAcaoTopo,
              background: travaGeral ? '#fee2e2' : '#dcfce7',
              color: travaGeral ? '#b91c1c' : '#15803d',
              border: travaGeral ? '1px solid #f87171' : '1px solid #86efac',
            }}
          >
            {travaGeral ? "🔒 TRAVA GERAL: LIGADA" : "🔓 TRAVA GERAL: LIVRE"}
          </button>

          <button
            type="button"
            style={styles.btnAdicionarCartelaFixa}
            onClick={adicionarCartelaFixa}
          >
            ➕ Adicionar Cartela ({cartelasFixas.length})
          </button>
          
          <button
            type="button"
            style={styles.btnNovoGabarito}
            onClick={adicionarGabarito}
          >
            📋 + Cartela Gabarito {gabaritos.length > 0 && `(${gabaritos.length})`}
          </button>

          {gabaritos.length > 0 && (
            <button
              type="button"
              onClick={limparTodosGabaritos}
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                padding: '10px 14px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(185, 28, 28, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Apagar todos os gabaritos da tela"
            >
              🗑️ Limpar Gabaritos ({gabaritos.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setRelatorioGeralAberto(true)}
            disabled={gabaritos.length === 0}
            style={{
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #6ee7b7',
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 800,
              fontSize: 13,
              cursor: gabaritos.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 5px rgba(4, 120, 87, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Ver resumo de premiação geral"
          >
            🏆 Relatório Geral {gabaritos.length > 0 && `(${gabaritos.length})`}
          </button>

          <button
            type="button"
            style={styles.btnTelemetria}
            onClick={() => {
              window.open(
                '/telemetria',
                'TelemetriaLotomania',
                'width=1200,height=850,menubar=no,toolbar=no,location=no,status=no'
              );
            }}
          >
            🚀 Telemetria 2ª Tela
          </button>
        </div>
      </div>

      <h1 style={styles.title}>GERADOR TÁTICO 5x20</h1>

      {/* Auto-Organização */}
      <div style={styles.barraAutoOrganizacao}>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
          🎯 Auto-Organizar Bancada:
        </span>
        
        <button 
          type="button" 
          onClick={agruparPorSimilaridadeDeFalhas} 
          style={{ ...styles.btnFiltroAuto, background: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc' }}
        >
          🧬 Agrupar Falhas Parecidas
        </button>

        <button 
          type="button" 
          onClick={() => ordenarCartelasPor('topo')} 
          style={styles.btnFiltroAuto}
        >
          ⬆ Vazias Embaixo (Foco Topo)
        </button>

        <button 
          type="button" 
          onClick={() => ordenarCartelasPor('base')} 
          style={styles.btnFiltroAuto}
        >
          ⬇ Vazias em Cima (Foco Base)
        </button>

        <button 
          type="button" 
          onClick={() => ordenarCartelasPor('qtdVazias')} 
          style={styles.btnFiltroAuto}
        >
          🕳 Mais Vazias Primeiro
        </button>

        <button 
          type="button" 
          onClick={() => ordenarCartelasPor('numero')} 
          style={{ ...styles.btnFiltroAuto, background: '#f8fafc' }}
        >
          🔢 Ordem Original (#1, #2...)
        </button>
      </div>

      {/* Cartelas Fixas */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? 14 : 12,
        maxWidth: 1300,
        margin: '0 auto 30px auto',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        {cartelasFixas.map((cartela, idx) => (
          <CartaoMontarJogo 
            key={cartela.id}
            cartela={cartela}
            indice={idx}
            totalCartelas={cartelasFixas.length}
            alternarNumero={alternarNumeroCartelaFixa}
            salvarCartela={salvarCartelaFixa}
            removerCartela={removerCartelaFixa}
            alternarTravaIndividual={alternarTravaIndividual}
            trocarDiretoPosicao={trocarDiretoPosicao}
            cartelaSelecionadaParaTroca={cartelaSelecionadaParaTroca}
            iniciarTroca={iniciarOuExecutarTroca}
            travaGeralAtiva={travaGeral}
            celulaCartelaStyle={celulaEstilo}
            gabaritos={gabaritos}
            CORES_GABARITO={CORES_GABARITO}
            gabaritoAtivoParaComparacaoId={gabaritoAtivoParaComparacaoId}
            setGabaritoAtivoParaComparacaoId={setGabaritoAtivoParaComparacaoId}
          />
        ))}
      </div>

      {/* Cartelas Salvas */}
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
                      setEditandoIdx(null);
                    }}>OK</button>
                    <button style={styles.btnAcao} onClick={() => setEditandoIdx(null)}>Sair</button>
                  </>
                ) : (
                  <>
                    <button style={styles.btnAcao} onClick={() => { setEditandoIdx(idx); setCartelaEditTemp(arr.map(l => [...l])); }}>Editar</button>
                    <button style={{ ...styles.btnAcao, background: '#fee2e2', color: '#ef4444' }} onClick={() => {
                      setSalvos(prev => prev.filter((_, i) => i !== idx));
                    }}>Excluir</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE RELATÓRIO GERAL */}
      {relatorioGeralAberto && relatorioAuditoriaGeral && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 16,
            width: '100%',
            maxWidth: 720,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  🏆 RELATÓRIO GERAL DE AUDITORIA DA BANCADA
                </h2>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Varredura de {relatorioAuditoriaGeral.totalGabaritos} gabaritos contra {relatorioAuditoriaGeral.totalCartelas} cartelas fixas
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRelatorioGeralAberto(false)}
                style={{
                  background: '#fee2e2',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {relatorioAuditoriaGeral.campeao.acertos > 0 && (
                <div style={{
                  background: '#ecfdf5',
                  border: '2px solid #34d399',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#065f46', textTransform: 'uppercase' }}>
                      🌟 Maior Pontuação da Rodada:
                    </span>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#047857' }}>
                      {relatorioAuditoriaGeral.campeao.acertos} Pontos!
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#065f46' }}>
                    Alcançado pelo <b>{relatorioAuditoriaGeral.campeao.gabaritoNome}</b><br />
                    na <b>Cartela #{relatorioAuditoriaGeral.campeao.cartelaNumero}</b>
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#334155', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                  Distribuição de Prêmios e Acertos:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[20, 19, 18, 17, 16, 15, 0, 14].map((pts) => {
                    const qtd = relatorioAuditoriaGeral.faixasPontos[pts] || 0;
                    const ehPremio = pts >= 15 || pts === 0;

                    return (
                      <div key={pts} style={{
                        background: ehPremio && qtd > 0 ? '#f0fdf4' : '#f8fafc',
                        border: ehPremio && qtd > 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '8px 10px',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: pts === 0 ? '#b45309' : ehPremio ? '#15803d' : '#64748b' }}>
                          {pts === 0 ? '🎯 0 Pontos' : pts === 14 ? '⚠️ 14 Pontos' : `🏆 ${pts} Pontos`}
                        </span>
                        <div style={{ fontSize: 18, fontWeight: 900, color: ehPremio && qtd > 0 ? '#166534' : '#334155', marginTop: 2 }}>
                          {qtd}x
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#334155', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                  Melhor Desempenho por Cartela Fixa:
                </span>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  {relatorioAuditoriaGeral.detalhePorCartela.map((item) => (
                    <div key={item.numeroCartela} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: 11,
                      background: item.melhorAcerto >= 15 ? '#f0fdf4' : '#ffffff'
                    }}>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>
                        Cartela #{item.numeroCartela}
                      </span>
                      <span style={{ color: item.melhorAcerto >= 15 ? '#15803d' : '#64748b', fontWeight: 800 }}>
                        Melhor: <b>{item.melhorAcerto} pts</b> ({item.melhorGabarito})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#f1f5f9", minHeight: "100vh", fontFamily: "sans-serif", position: 'relative' as const },
  title: { fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 12, textAlign: 'center' as const },
  topoAcoesBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, maxWidth: 1300, margin: '0 auto 20px auto', flexWrap: 'wrap' as const, gap: 10 },
  btnVoltar: { background: '#e0e7ef', border: 'none', borderRadius: 8, padding: '10px 15px', fontWeight: 700, cursor: 'pointer', color: '#334155' },
  btnAcaoTopo: {
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease'
  },
  btnRaioX: {
    color: '#ffffff',
    border: '1px solid #0369a1',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
  },
  btnAutoTrava: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnAdicionarCartelaFixa: {
    background: '#dbeafe',
    color: '#1d4ed8',
    border: '1px solid #93c5fd',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  btnNovoGabarito: {
    background: '#fef08a',
    color: '#854d0e',
    border: '1px solid #eab308',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  btnTelemetria: {
    background: '#090d16',
    color: '#38bdf8',
    border: '1px solid #0284c7',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  barraAutoOrganizacao: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
    maxWidth: 1300,
    margin: '0 auto 24px auto',
    padding: '8px 14px',
    background: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
  },
  btnFiltroAuto: {
    background: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.15s ease'
  },
  cardPrincipal: { 
    background: "#fff", 
    padding: 16, 
    borderRadius: 16, 
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)", 
    border: "1px solid #e2e8f0", 
    transition: 'all 0.15s ease',
    userSelect: 'none' as const
  },
  btnMover: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    padding: '2px 4px',
    fontSize: 9,
    fontWeight: 800,
    cursor: 'pointer',
    color: '#475569'
  },
  cardTitle: { fontSize: 12, fontWeight: 800, color: "#64748b", margin: 0, textTransform: 'uppercase' as const },
  gradeSelecao: { display: 'flex', flexDirection: 'column' as const, gap: 4, alignItems: 'center' },
  celulaCartela: { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontWeight: 700, fontSize: 13 },
  celulaMini: { width: 20, height: 20, fontSize: 9, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSalvar: { width: '100%', padding: "8px", border: "none", borderRadius: 8, color: "white", fontWeight: "bold", marginTop: 8, cursor: 'pointer', fontSize: 12 },
  gridSalvos: { display: "flex", flexWrap: "wrap" as const, gap: 12, justifyContent: 'center' },
  jogoSalvoGrade: { background: "#fff", borderRadius: 12, padding: 10, border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  badgeNumero: { background: "#f1f5f9", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, marginBottom: 5 },
  btnAcao: { flex: 1, padding: '5px', fontSize: 10, fontWeight: 700, border: 'none', borderRadius: 4, cursor: 'pointer', background: '#f1f5f9' },
  gabaritoContainer: { position: 'fixed' as const, zIndex: 9999, background: 'transparent', borderRadius: 12, padding: '8px 8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', pointerEvents: 'none' as const, maxWidth: 240, width: 'auto' },
  alcaGabarito: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'grab', background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', userSelect: 'none' as const, pointerEvents: 'auto' as const, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  badgeContadorGabarito: { fontSize: 11, fontWeight: 900, background: '#f1f5f9', padding: '1px 6px', borderRadius: 8, color: '#334155' },
  btnAcaoMini: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, cursor: 'pointer', padding: 0, color: '#475569' },

  alertaTrocaAtiva: {
    position: 'fixed' as const,
    top: 15,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10000,
    background: '#1e293b',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: 30,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    fontSize: 13,
    fontWeight: 600,
    border: '2px solid #3b82f6'
  },
  btnCancelarTroca: {
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: 20,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer'
  },

  janelaFlutuanteRaioX: {
    position: 'fixed' as const,
    zIndex: 9998,
    background: '#ffffff',
    borderRadius: 14,
    boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
    border: '2px solid #0284c7',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  alcaJanelaFlutuante: {
    background: '#f0f9ff',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab',
    borderBottom: '1px solid #bae6fd',
    userSelect: 'none' as const,
  },
  btnFecharFlutuante: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    width: 22,
    height: 22,
    borderRadius: 4,
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  corpoFlutuante: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    maxHeight: '75vh',
    overflowY: 'auto' as const
  },
  gridMapaCalorFlutuante: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 3,
    background: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  },
  celulaMapaFlutuante: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 1px',
    borderRadius: 4,
    border: '1px solid transparent',
  }
};
