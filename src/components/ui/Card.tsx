/**
 * Card Component
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '16px',
    ...style,
  };

  return <div style={baseStyles}>{children}</div>;
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
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', ...style }}>
      {children}
    </div>
  );
}
