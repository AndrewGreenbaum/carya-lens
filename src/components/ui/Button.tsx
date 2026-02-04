/**
 * Button Component
 * Dark theme matching Carya Eagle Eye frontend
 */

import React, { useState } from 'react';
import { CARYA_COLORS } from './Card';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

// Loading spinner component
const Spinner = () => (
  <span style={{
    display: 'inline-block',
    width: '12px',
    height: '12px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    marginRight: '6px',
  }} />
);

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.2s ease',
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: isHovered ? CARYA_COLORS.accentHover : CARYA_COLORS.accent,
      color: '#000',
    },
    secondary: {
      backgroundColor: isHovered ? CARYA_COLORS.cardBackgroundHover : CARYA_COLORS.cardBackground,
      color: CARYA_COLORS.textPrimary,
      border: `1px solid ${CARYA_COLORS.border}`,
    },
    ghost: {
      backgroundColor: isHovered ? CARYA_COLORS.cardBackgroundHover : 'transparent',
      color: CARYA_COLORS.textSecondary,
    },
    danger: {
      backgroundColor: isHovered ? '#da3633' : CARYA_COLORS.error,
      color: 'white',
    },
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '4px 10px', fontSize: '12px' },
    md: { padding: '6px 14px', fontSize: '13px' },
    lg: { padding: '8px 18px', fontSize: '14px' },
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    console.log('[Carya] Button clicked', { variant, loading });
    onClick?.(e);
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        style={{ ...baseStyles, ...variantStyles[variant], ...sizeStyles[size] }}
        disabled={disabled || loading}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    </>
  );
}
