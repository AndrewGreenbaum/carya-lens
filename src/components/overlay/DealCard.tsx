/**
 * Deal Card Component
 *
 * Displays deal information: funding amount, investor, stage, date.
 */

import React from 'react';
import type { DealData } from '../../types/deals';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface DealCardProps {
  deal: DealData;
  isTracked?: boolean;
  onAddToTracker?: () => void;
  onRefresh?: () => void;
}

export function DealCard({ deal, isTracked = false, onAddToTracker, onRefresh }: DealCardProps) {
  console.log('[Carya] Rendering DealCard', { companyName: deal.companyName, fundingAmount: deal.fundingAmount });

  const handleAddToTracker = () => {
    console.log('[Carya] Add to tracker clicked', { companyName: deal.companyName });
    onAddToTracker?.();
  };

  const handleRefresh = () => {
    console.log('[Carya] Refresh clicked', { companyName: deal.companyName });
    onRefresh?.();
  };

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
              {deal.companyName}
            </div>
          </div>
          <Badge variant={getStageBadgeVariant(deal.roundStage)}>
            {deal.roundStage}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Funding Amount */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
            {formatCurrency(deal.fundingAmount)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {deal.currency || 'USD'}
          </div>
        </div>

        {/* Lead Investor */}
        {deal.leadInvestor && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lead Investor
            </div>
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
              {deal.leadInvestor.name}
            </div>
          </div>
        )}

        {/* Deal Date */}
        {deal.dealDate && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date
            </div>
            <div style={{ fontSize: '13px', color: '#374151' }}>
              {formatDate(deal.dealDate)}
            </div>
          </div>
        )}

        {/* Verification */}
        {deal.verificationContent && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6b7280',
            fontStyle: 'italic',
          }}>
            "{deal.verificationContent.slice(0, 100)}{deal.verificationContent.length > 100 ? '...' : ''}"
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isTracked && onAddToTracker && (
            <Button variant="primary" size="sm" onClick={handleAddToTracker}>
              Add to Tracker
            </Button>
          )}
          {isTracked && (
            <Badge variant="success">Tracked</Badge>
          )}
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              ↻ Refresh
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function getStageBadgeVariant(stage: string): 'default' | 'info' | 'success' | 'warning' {
  const stageLower = stage.toLowerCase();
  if (stageLower.includes('seed') || stageLower.includes('pre')) return 'default';
  if (stageLower.includes('a')) return 'info';
  if (stageLower.includes('b') || stageLower.includes('c')) return 'success';
  if (stageLower.includes('d') || stageLower.includes('late')) return 'warning';
  return 'default';
}
