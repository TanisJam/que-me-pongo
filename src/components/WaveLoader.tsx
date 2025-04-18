import React from 'react';

export default function WaveLoader({ height = 40, width = 80, barWidth = 10, barGap = 8 }) {
  const colors = [
    'var(--primary-blue)',
    'var(--primary-red)',
    'var(--primary-yellow)',
    'var(--primary-blue)',
    'var(--primary-red)'
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height, width, gap: barGap }}>
      {colors.map((color, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: height * 0.6,
            background: color,
            borderRadius: 6,
            animation: `wave-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave-bounce {
          0%, 100% { transform: scaleY(0.7); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
} 