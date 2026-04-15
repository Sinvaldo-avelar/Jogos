"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function TaticoCartao() {
	// 50 linhas x 10 colunas = 500 blocos
	const totalRows = 150;
	const totalCols = 10;
	// 0: normal, 1: azul, 2: vermelho
	const [states, setStates] = useState(Array(totalRows * totalCols).fill(0));

	function handleClick(idx) {
		setStates((prev) => {
			const next = [...prev];
			next[idx] = (next[idx] + 1) % 3;
			return next;
		});
	}

	return (
		<div style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}>
			<Link
				href="/"
				style={{
					position: 'fixed',
					top: 24,
					left: 24,
					zIndex: 100,
					background: '#2563eb',
					color: '#fff',
					padding: '12px 22px',
					borderRadius: 8,
					textDecoration: 'none',
					fontWeight: 600,
					fontSize: 18,
					border: 'none',
					boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
					cursor: 'pointer',
					transition: 'background 0.2s',
					display: 'inline-block',
				}}
			>
				← Central de Jogos
			</Link>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
					background: '#fff',
					padding: 24,
					borderRadius: 16,
					boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
					border: '1px solid #e5e7eb',
					width: 'max-content',
					maxHeight: '80vh',
					overflowY: 'auto',
					margin: '0 auto',
					marginTop: 60,
				}}
			>
				{Array.from({ length: totalRows }).map((_, row) => (
					<div key={row} style={{ display: 'flex', gap: 8 }}>
						{Array.from({ length: totalCols }).map((_, col) => {
							const idx = row * totalCols + col;
							let bg = '#fff';
							let color = '#1e293b';
							if (states[idx] === 1) {
								bg = '#2563eb'; // azul
								color = '#fff';
							} else if (states[idx] === 2) {
								bg = '#dc2626'; // vermelho
								color = '#fff';
							}
							return (
								<button
									key={col}
									onClick={() => handleClick(idx)}
									style={{
										width: 40,
										height: 40,
										border: '1px solid #cbd5e1',
										borderRadius: 8,
										background: bg,
										color: color,
										fontWeight: 600,
										fontSize: 16,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
										cursor: 'pointer',
										userSelect: 'none',
										transition: 'background 0.2s, color 0.2s',
									}}
								>
									{(col + 1).toString().padStart(2, '0')}
								</button>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
