import React, { type CSSProperties } from 'react';

// Estilos para o fundo da carta
const cardBackStyle: CSSProperties = {
  width: '250px', // Mesma largura do PlayingCard
  height: '350px', // Mesma altura do PlayingCard
  borderRadius: '12px', // Mesma borda do PlayingCard
  backgroundColor: '#1a1a1a', // Fundo preto/cinza escuro
  border: '8px solid #b71c1c', // Borda vermelha escura (consistente com Poder)
  position: 'relative', // Para posicionar elementos internos
  overflow: 'hidden', // Garante que o conteúdo fique dentro das bordas
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

// Estilo para o texto diagonal
const diagonalTextStyle: CSSProperties = {
  position: 'absolute',
  fontSize: '2.8em', // Tamanho do texto aumentado
  fontWeight: 'bold', // Já estava bold, mas garantimos
  color: '#e53935', // Cor vermelha (consistente com Poder)
  opacity: 0.8, // Leve transparência
  transform: 'rotate(-45deg)', // Rotação diagonal
  whiteSpace: 'nowrap', // Evita quebra de linha
  userSelect: 'none', // Impede seleção de texto
  pointerEvents: 'none', // Não interfere com cliques
};

// Estilo para as linhas diagonais
const diagonalLinesStyle: CSSProperties = {
  position: 'absolute',
  width: '200%', // Cobrir a área diagonalmente
  height: '200%', // Cobrir a área diagonalmente
  background: 'repeating-linear-gradient(-45deg, #e53935, #e53935 5px, #1a1a1a 5px, #1a1a1a 15px)', // Linhas vermelhas e pretas
  opacity: 0.1, // Bem sutil
  transform: 'translate(-25%, -25%) rotate(-45deg)', // Posiciona e gira as linhas
  userSelect: 'none',
  pointerEvents: 'none',
};

function CardBack() {
  return (
    <div style={cardBackStyle}>
      {/* Fundo com linhas diagonais */}
      <div style={diagonalLinesStyle}></div>

      {/* Texto diagonal */}
      <div style={diagonalTextStyle}>
        Kink 🔗 Link
      </div>
    </div>
  );
}

export default CardBack;
