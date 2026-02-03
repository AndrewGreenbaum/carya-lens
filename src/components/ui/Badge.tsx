/**
 * Badge Component
 */

import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: { backgroundColor: '#f3f4f6', color: '#374151' },
    success: { backgroundColor: '#dcfce7', color: '#166534' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b' },
    info: { backgroundColor: '#dbeafe', color: '#1e40af' },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 500,
    ...variantStyles[variant],
    ...style,
  };

  return <span style={baseStyles}>{children}</span>;
}
