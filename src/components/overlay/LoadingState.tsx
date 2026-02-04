/**
 * Loading State Component
 * Dark theme matching Carya Eagle Eye frontend
 */

import React from 'react';
import { Card, CARYA_COLORS } from '../ui/Card';

export function LoadingState() {
  console.log('[Carya] Rendering LoadingState');

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${CARYA_COLORS.border}`,
            borderTopColor: CARYA_COLORS.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ color: CARYA_COLORS.textSecondary, fontSize: '14px' }}>
          Looking up deal data...
        </span>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
}
