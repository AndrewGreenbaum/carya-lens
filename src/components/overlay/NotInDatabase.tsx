/**
 * Not In Database Component
 *
 * Shown when company/founder is not found in the deal database.
 * Dark theme matching Carya Eagle Eye frontend.
 */

import React from 'react';
import { Card, CardContent, CARYA_COLORS } from '../ui/Card';
import { Button } from '../ui/Button';

export interface NotInDatabaseProps {
  companyName?: string | null;
  founderName?: string | null;
  searchQuery?: string | null;
  onSuggest?: () => void;
}

// Carya logo - green dot + text matching Eagle Eye header
const CaryaLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: CARYA_COLORS.success,
      boxShadow: `0 0 6px ${CARYA_COLORS.success}`,
    }} />
    <span style={{
      fontSize: '11px',
      fontWeight: 600,
      color: CARYA_COLORS.textSecondary,
      letterSpacing: '1px',
      textTransform: 'uppercase',
    }}>
      CARYA LENS
    </span>
  </div>
);

export function NotInDatabase({ companyName, founderName, searchQuery, onSuggest }: NotInDatabaseProps) {
  const displayName = searchQuery || founderName || companyName;
  const isFounderSearch = !!founderName && !companyName;

  console.log('[Carya] Rendering NotInDatabase', { displayName, isFounderSearch });

  const handleSuggest = () => {
    console.log('[Carya] Suggest addition clicked', { displayName });
    onSuggest?.();
  };

  const getMessage = () => {
    if (isFounderSearch && displayName) {
      return `No deals found for "${displayName}"`;
    }
    if (displayName) {
      return `"${displayName}" hasn't been tracked yet.`;
    }
    return 'No deals found.';
  };

  return (
    <Card>
      {/* Header with logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${CARYA_COLORS.border}`,
      }}>
        <CaryaLogo />
      </div>

      <CardContent>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: CARYA_COLORS.textPrimary, marginBottom: '4px' }}>
            {isFounderSearch ? 'No Deals Found' : 'Not in Database'}
          </div>
          <div style={{ fontSize: '12px', color: CARYA_COLORS.textSecondary, marginBottom: '12px' }}>
            {getMessage()}
          </div>
          {onSuggest && (
            <Button variant="secondary" size="sm" onClick={handleSuggest}>
              Suggest Addition
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
