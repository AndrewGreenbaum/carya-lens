/**
 * Badge Component
 * Dark theme matching Carya Eagle Eye frontend
 */

import React from 'react';
import { CARYA_COLORS } from './Card';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'seed';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  // Dark theme badge styles matching Carya Eagle Eye
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: {
      backgroundColor: CARYA_COLORS.badgeBg,
      color: CARYA_COLORS.badgeText,
      border: `1px solid ${CARYA_COLORS.badgeText}40`,
    },
    success: {
      backgroundColor: 'rgba(63, 185, 80, 0.15)',
      color: '#3fb950',
      border: '1px solid rgba(63, 185, 80, 0.4)',
    },
    warning: {
      backgroundColor: 'rgba(210, 153, 34, 0.15)',
      color: '#d29922',
      border: '1px solid rgba(210, 153, 34, 0.4)',
    },
    error: {
      backgroundColor: 'rgba(248, 81, 73, 0.15)',
      color: '#f85149',
      border: '1px solid rgba(248, 81, 73, 0.4)',
    },
    info: {
      backgroundColor: CARYA_COLORS.badgeBg,
      color: CARYA_COLORS.badgeText,
      border: `1px solid ${CARYA_COLORS.badgeText}40`,
    },
    seed: {
      backgroundColor: CARYA_COLORS.seedBadgeBg,
      color: CARYA_COLORS.seedBadgeText,
      border: `1px solid ${CARYA_COLORS.seedBadgeText}40`,
    },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ...variantStyles[variant],
    ...style,
  };

  return <span style={baseStyles}>{children}</span>;
}
