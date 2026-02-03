/**
 * Not In Database Component
 *
 * Shown when company/founder is not found in the deal database.
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export interface NotInDatabaseProps {
  companyName: string | null;
  onSuggest?: () => void;
}

export function NotInDatabase({ companyName, onSuggest }: NotInDatabaseProps) {
  console.log('[Carya] Rendering NotInDatabase', { companyName });

  const handleSuggest = () => {
    console.log('[Carya] Suggest addition clicked', { companyName });
    onSuggest?.();
  };

  return (
    <Card>
      <CardContent>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
            Not in Database
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            {companyName ? `"${companyName}" hasn't been tracked yet.` : 'This company hasn\'t been tracked yet.'}
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
