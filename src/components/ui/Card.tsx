/**
 * Card Component
 * Dark theme matching Carya Eagle Eye frontend
 */

import React from 'react';

// Carya design tokens
export const CARYA_COLORS = {
  background: '#0d1117',
  cardBackground: '#161b22',
  cardBackgroundHover: '#1c2128',
  border: '#30363d',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  accent: '#00d4aa', // Teal for amounts
  accentHover: '#00f0c0',
  badgeBg: 'rgba(0, 212, 170, 0.15)',
  badgeText: '#00d4aa',
  seedBadgeBg: 'rgba(187, 128, 255, 0.15)',
  seedBadgeText: '#bb80ff',
  success: '#3fb950',
  error: '#f85149',
  warning: '#d29922',
};

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: CARYA_COLORS.cardBackground,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    padding: '16px',
    animation: 'fadeIn 0.3s ease-out',
    border: `1px solid ${CARYA_COLORS.border}`,
    color: CARYA_COLORS.textPrimary,
    ...style,
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={baseStyles}>{children}</div>
    </>
  );
}

export function CardHeader({ children, style }: CardProps) {
  return (
    <div style={{ marginBottom: '12px', ...style }}>
      {children}
    </div>
  );
}

export function CardContent({ children, style }: CardProps) {
  return (
    <div style={{ ...style }}>
      {children}
    </div>
  );
}

export function CardFooter({ children, style }: CardProps) {
  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${CARYA_COLORS.border}`, ...style }}>
      {children}
    </div>
  );
}
