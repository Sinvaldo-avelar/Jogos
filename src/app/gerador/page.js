"use client";


import { useState } from "react";

const COLUNAS = 4;
// Cartela: 10 linhas de 4 colunas (coluna 1: 1-10, coluna 2: 11-20, ...)
// Cartela: 4 colunas, cada uma com 01 a 10
const LINHAS = 4;
const NUMS = Array.from({ length: 10 }, (_, i) => i + 1);


export default function Gerador() {
	// Array de arrays: cada coluna tem seus números selecionados
	const [selecionadas, setSelecionadas] = useState(() => Array(COLUNAS).fill().map(() => []));
	const [salvos, setSalvos] = useState(() => {
		if (typeof window !== "undefined") {
			const s = localStorage.getItem("gerador_cartelas");
			return s ? JSON.parse(s) : [];
		}
		return [];
	});
	const [msg, setMsg] = useState("");

	// Alterna seleção de número em uma coluna (todas as colunas vão de 1 a 10)
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

	// Salva a cartela
	const salvarCartela = () => {
		// Garante que cada coluna tenha 5 números entre 1 e 10
		for (let colIdx = 0; colIdx < COLUNAS; colIdx++) {
			const arr = selecionadas[colIdx];
			if (arr.length !== 5) {
				setMsg(`Selecione 5 números na coluna ${colIdx + 1} (01 a 10).`);
				return;
			}
			if (!arr.every(num => num >= 1 && num <= 10)) {
				setMsg(`Os números da coluna ${colIdx + 1} devem ser de 01 a 10.`);
				return;
			}
		}
		// Salva os 20 números escolhidos (5 de cada coluna)
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

	// Renderiza a cartela única e as salvas ao lado
	return (
		<div style={styles.container}>
			<h1 style={styles.title}>GERADOR DE CARTELA LOTOMANIA</h1>
			<div style={{ marginBottom: 10, color: msg.startsWith("⚠️") ? "#b91c1c" : "#16a34a", fontWeight: 600 }}>{msg}</div>
			<div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
				<div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, alignItems: 'center' }}>
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
							marginTop: 8,
							display: 'block',
							marginLeft: 'auto',
							marginRight: 'auto'
						}}
						onClick={salvarCartela}
						disabled={!selecionadas.every(arr => arr.length === 5)}
					>
						SALVAR CARTELA
					</button>
				</div>
				{/* Cartelas salvas */}
				<div style={{ flex: 1 }}>
					<h3 style={styles.cardTitle}>CARTELAS SALVAS ({salvos.length})</h3>
					<div style={styles.gridSalvos}>
						{salvos.map((arr, idx) => (
							<div key={idx} style={{ ...styles.jogoSalvoGrade, alignItems: 'center' }}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4, alignItems: 'center' }}>
									{arr.map((linha, linhaIdx) => (
										<div key={linhaIdx} style={{ display: 'flex', gap: 4 }}>
											{NUMS.map(num => {
												const selecionado = linha.includes(num);
												return (
													<span
														key={num}
														style={{
															...styles.celulaCartela,
															background: selecionado ? "#3b82f6" : "#fff",
															color: selecionado ? "#fff" : "#334155",
															border: selecionado ? "2px solid #2563eb" : "1px solid #cbd5e1",
															opacity: selecionado ? 1 : 0.5
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
									style={{
										marginTop: 6,
										background: "#ef4444",
										color: "#fff",
										border: "none",
										borderRadius: 4,
										padding: "2px 8px",
										cursor: "pointer",
										fontSize: 12,
										fontWeight: 700,
										alignSelf: "center"
									}}
									title="Excluir cartela"
									onClick={() => {
										const novos = salvos.filter((_, i2) => i2 !== idx);
										setSalvos(novos);
										localStorage.setItem("gerador_cartelas", JSON.stringify(novos));
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
		</div>
	);
}

const styles = {
	container: { background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "sans-serif" },
	title: { fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 },
	cartelaBox: { background: "#fff", borderRadius: 10, padding: 18, minWidth: 340, boxShadow: "0 1px 4px #0001", display: "flex", flexDirection: "column", alignItems: "center" },
	blocoTitulo: { fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 10 },
	numerosGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 },
	numBtn: { width: 44, height: 44, borderRadius: 8, fontWeight: 700, fontSize: 18, margin: 0, padding: 0, transition: "all .15s" },
	btnSalvar: { marginTop: 10, padding: "12px 30px", border: "none", borderRadius: 8, color: "white", fontWeight: "bold", fontSize: 15 },
	cardTitle: { fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 },
	gridSalvos: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, marginTop: 10 },
	jogoSalvoGrade: { background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid #e5e7eb", minWidth: 0 },
	colNum: { background: "#3b82f6", color: "#fff", borderRadius: 4, padding: "2px 7px", fontSize: 13, marginLeft: 2 },
	cartelaLotomania: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 2, margin: "8px 0" },
	celulaCartela: { width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontWeight: 700, fontSize: 14, transition: "all .15s" },
};
