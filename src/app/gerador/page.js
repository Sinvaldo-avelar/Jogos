"use client";

import { useState, useMemo } from "react";

const COLS = 10;
const ROWS = 10;
const NUMS = Array.from({ length: 10 }, (_, i) => String(i).padStart(2, "0"));

export default function Gerador() {
	const [selecionadas, setSelecionadas] = useState([]); // colunas selecionadas (índices)
	const [salvos, setSalvos] = useState(() => {
		if (typeof window !== "undefined") {
			const s = localStorage.getItem("gerador_colunas");
			return s ? JSON.parse(s) : [];
		}
		return [];
	});
	const [msg, setMsg] = useState("");

	// Atualiza localStorage ao salvar
	const salvarColunas = () => {
		if (selecionadas.length !== 7) {
			setMsg("Selecione exatamente 7 colunas.");
			return;
		}
		const novo = [...selecionadas].sort((a, b) => a - b);
		const jaSalvo = salvos.some(arr => JSON.stringify(arr) === JSON.stringify(novo));
		if (jaSalvo) {
			setMsg("⚠️ Jogo já foi salvo!");
			return;
		}
		const novosSalvos = [novo, ...salvos];
		setSalvos(novosSalvos);
		localStorage.setItem("gerador_colunas", JSON.stringify(novosSalvos));
		setMsg("Jogo salvo!");
	};

	// Alterna seleção de coluna
	const alternarColuna = (idx) => {
		setMsg("");
		setSelecionadas(sel =>
			sel.includes(idx)
				? sel.filter(i => i !== idx)
				: sel.length < 7
				? [...sel, idx]
				: sel
		);
	};

	// Renderiza grid 11x11 com bordas
	return (
		<div style={styles.container}>
			<h1 style={styles.title}>GERADOR 7 COLUNAS</h1>
			<div style={{ marginBottom: 10, color: msg.startsWith("⚠️") ? "#b91c1c" : "#16a34a", fontWeight: 600 }}>{msg}</div>
			<div style={{ overflowX: "auto", marginBottom: 20 }}>
				<table style={styles.table}>
					<tbody>
						{/* Cabeçalho vertical */}
						{NUMS.map((n, colIdx) => (
							<tr key={n}>
								<th style={styles.th}>
									<button
										style={{
											...styles.colBtn,
											background: selecionadas.includes(colIdx) ? "#3b82f6" : "#f1f5f9",
											color: selecionadas.includes(colIdx) ? "#fff" : "#334155",
											border: selecionadas.includes(colIdx) ? "2px solid #2563eb" : "1px solid #cbd5e1",
											cursor: "pointer",
										}}
										onClick={() => alternarColuna(colIdx)}
									>
										{n}
									</button>
								</th>
								{/* Linhas do grid */}
								{NUMS.map((_, rowIdx) => (
									<td
										key={rowIdx}
										style={{
											...styles.td,
											background: selecionadas.includes(colIdx)
												? "#dbeafe"
												: "#fff",
											border: "1px solid #e5e7eb",
										}}
									></td>
								))}
							</tr>
						))}
						{/* Cabeçalho horizontal (embaixo, opcional) */}
						<tr>
							<th style={styles.th}></th>
							{NUMS.map((n) => (
								<th key={n} style={styles.th}>{n}</th>
							))}
						</tr>
					</tbody>
				</table>
			</div>
			<button
				style={{
					...styles.btnSalvar,
					background: selecionadas.length === 7 ? "#16a34a" : "#cbd5e1",
					cursor: selecionadas.length === 7 ? "pointer" : "not-allowed",
				}}
				onClick={salvarColunas}
				disabled={selecionadas.length !== 7}
			>
				SALVAR JOGO
			</button>
			<div style={{ marginTop: 30 }}>
				<h3 style={styles.cardTitle}>JOGOS SALVOS ({salvos.length})</h3>
				<div style={styles.listaSalvos}>
					{salvos.map((arr, idx) => (
						<div key={idx} style={styles.jogoSalvo}>
							<span style={{ fontWeight: 600 }}>#{salvos.length - idx}</span>:
							{arr.map(i => (
								<span key={i} style={styles.colNum}>{NUMS[i]}</span>
							))}
							<button
								style={{
									marginLeft: 10,
									background: "#ef4444",
									color: "#fff",
									border: "none",
									borderRadius: 4,
									padding: "2px 8px",
									cursor: "pointer",
									fontSize: 12,
									fontWeight: 700,
								}}
								title="Excluir jogo"
								onClick={() => {
									const novos = salvos.filter((_, i) => i !== idx);
									setSalvos(novos);
									localStorage.setItem("gerador_colunas", JSON.stringify(novos));
									setMsg("");
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
	container: { background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "sans-serif" },
	title: { fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 },
	table: { borderCollapse: "collapse", margin: "auto" },
	th: { background: "#f8fafc", fontSize: 12, fontWeight: 700, padding: 4, textAlign: "center" },
	td: { width: 28, height: 28, textAlign: "center" },
	colBtn: { width: 32, height: 32, borderRadius: 6, fontWeight: 700, fontSize: 13, margin: 0, padding: 0 },
	btnSalvar: { marginTop: 10, padding: "12px 30px", border: "none", borderRadius: 8, color: "white", fontWeight: "bold", fontSize: 15 },
	cardTitle: { fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 },
	listaSalvos: { display: "flex", flexDirection: "column", gap: 6, marginTop: 10 },
	jogoSalvo: { background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb" },
	colNum: { background: "#3b82f6", color: "#fff", borderRadius: 4, padding: "2px 7px", fontSize: 13, marginLeft: 2 },
};
