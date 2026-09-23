import React, { useMemo } from 'react';

interface ModalRaioXProps {
  isOpen: boolean;
  onClose: () => void;
  // Lista de cartelas cadastradas, cada uma contendo um array de strings ['01', '02', ...]
  jogos: { id: string | number; dezenas: string[] }[];
}

export const ModalRaioX: React.FC<ModalRaioXProps> = ({ isOpen, onClose, jogos }) => {
  if (!isOpen) return null;

  // 1. Mapeamento e contagem exata das 100 dezenas (01 até 00)
  const estatisticas = useMemo(() => {
    // Inicializa as 100 posições com contagem zero
    const contadores: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) {
      const numStr = i === 100 ? '00' : String(i).padStart(2, '0');
      contadores[numStr] = 0;
    }

    // Percorre cada jogo cadastrado e incrementa a frequência
    jogos.forEach((jogo) => {
      jogo.dezenas.forEach((num) => {
        const formatado = num.trim().padStart(2, '0');
        if (contadores[formatado] !== undefined) {
          contadores[formatado] += 1;
        }
      });
    });

    const listaOrdenada = Object.entries(contadores).map(([numero, qtd]) => ({
      numero,
      qtd,
    }));

    const totalMarcacoes = listaOrdenada.reduce((acc, curr) => acc + curr.qtd, 0);
    const naoUsados = listaOrdenada.filter((item) => item.qtd === 0);
    const maisUsados = [...listaOrdenada].sort((a, b) => b.qtd - a.qtd).slice(0, 5);
    const maxQtd = Math.max(...listaOrdenada.map((item) => item.qtd), 1);

    return {
      contadores,
      listaOrdenada,
      totalMarcacoes,
      totalJogos: jogos.length,
      naoUsados,
      maisUsados,
      maxQtd,
    };
  }, [jogos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-emerald-400">
              Raio-X de Frequência das 100 Dezenas
            </h2>
            <p className="text-xs text-slate-400">
              Distribuição e contagem de dezenas digitadas em {estatisticas.totalJogos} cartelas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Painel */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Painel de Diagnóstico Rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cobertura do Volante</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {100 - estatisticas.naoUsados.length}
                </span>
                <span className="text-xs text-slate-400">/ 100 dezenas ativas</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <span className="text-xs text-rose-400 font-medium uppercase tracking-wider">Zonas Mortas (0 cliques)</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400">
                  {estatisticas.naoUsados.length}
                </span>
                <span className="text-xs text-slate-400">dezenas ignoradas</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Top Recorrência</span>
              <div className="mt-1 flex gap-2 flex-wrap">
                {estatisticas.maisUsados.map((item) => (
                  <span
                    key={item.numero}
                    className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs text-slate-200"
                  >
                    {item.numero}: <strong className="text-emerald-400">{item.qtd}x</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Grelha Completa das 100 Dezenas com Badges */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">Mapa de Calor (Volante Completo)</h3>
            <div className="grid grid-cols-10 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {estatisticas.listaOrdenada.map(({ numero, qtd }) => {
                const semUso = qtd === 0;
                const altaFrequencia = qtd >= estatisticas.maxQtd && qtd > 1;

                return (
                  <div
                    key={numero}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      semUso
                        ? 'bg-slate-900/40 border-slate-800/60 text-slate-600 opacity-40'
                        : altaFrequencia
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-bold font-mono">{numero}</span>
                    
                    {/* Badge minúsculo com o número de usos */}
                    <span
                      className={`text-[10px] font-semibold px-1 rounded-sm mt-0.5 ${
                        semUso
                          ? 'text-slate-600'
                          : altaFrequencia
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {qtd}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista Compacta de Zonas Mortas (Se houver) */}
          {estatisticas.naoUsados.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-2">
                Dezenas Não Contempladas em Nenhuma Cartela
              </span>
              <div className="flex flex-wrap gap-1.5">
                {estatisticas.naoUsados.map((item) => (
                  <span
                    key={item.numero}
                    className="bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs px-2 py-0.5 rounded font-mono"
                  >
                    {item.numero}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};