/**
 * Loading State Component
 */

import React from 'react';
import { Card } from '../ui/Card';

export function LoadingState() {
  console.log('[Carya] Rendering LoadingState');

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
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
