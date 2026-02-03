/**
 * Button Component
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

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
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    transition: 'background-color 0.2s, opacity 0.2s',
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: { backgroundColor: '#2563eb', color: 'white' },
    secondary: { backgroundColor: '#f3f4f6', color: '#1f2937' },
    ghost: { backgroundColor: 'transparent', color: '#4b5563' },
    danger: { backgroundColor: '#dc2626', color: 'white' },
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '4px 8px', fontSize: '12px' },
    md: { padding: '6px 12px', fontSize: '13px' },
    lg: { padding: '8px 16px', fontSize: '14px' },
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    console.log('[Carya] Button clicked', { variant, loading });
    onClick?.(e);
  };

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant], ...sizeStyles[size] }}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <span style={{ marginRight: '6px' }}>⏳</span>
      )}
      {children}
    </button>
  );
}
