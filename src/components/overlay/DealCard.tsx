/**
 * Deal Card Component
 *
 * Displays deal information: funding amount, investor, stage, date.
 * Dark theme matching Carya Eagle Eye frontend
 */

import React, { useState } from 'react';
import type { DealData } from '../../types/deals';
import { Card, CardHeader, CardContent, CardFooter, CARYA_COLORS } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface DealCardProps {
  deal: DealData;
  isTracked?: boolean;
  onAddToTracker?: () => void;
  onUntrack?: () => void;
  onRefresh?: () => void;
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

export function DealCard({ deal, isTracked = false, onAddToTracker, onUntrack, onRefresh }: DealCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log('[Carya] Rendering DealCard', { companyName: deal.companyName, fundingAmount: deal.fundingAmount });

  const handleAddToTracker = () => {
    console.log('[Carya] Add to tracker clicked', { companyName: deal.companyName });
    onAddToTracker?.();
  };

  const handleUntrack = () => {
    console.log('[Carya] Untrack clicked', { companyName: deal.companyName });
    onUntrack?.();
  };

  const handleRefresh = () => {
    console.log('[Carya] Refresh clicked', { companyName: deal.companyName });
    onRefresh?.();
  };

  const toggleCollapse = () => {
    console.log('[Carya] Toggle collapse', { isCollapsed: !isCollapsed });
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Card>
      {/* Header with logo and collapse toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isCollapsed ? '0' : '12px',
        paddingBottom: isCollapsed ? '0' : '8px',
        borderBottom: isCollapsed ? 'none' : `1px solid ${CARYA_COLORS.border}`,
      }}>
        <CaryaLogo />
        <button
          onClick={toggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            color: CARYA_COLORS.textSecondary,
            fontSize: '12px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = CARYA_COLORS.cardBackgroundHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isCollapsed ? '▼ Expand' : '▲ Collapse'}
        </button>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: CARYA_COLORS.textPrimary }}>
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
          <div style={{ fontSize: '24px', fontWeight: 700, color: CARYA_COLORS.accent }}>
            {formatCurrency(deal.fundingAmount)}
          </div>
          <div style={{ fontSize: '12px', color: CARYA_COLORS.textMuted }}>
            {deal.currency || 'USD'}
          </div>
        </div>

        {/* Lead Investor */}
        {deal.leadInvestor && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: CARYA_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lead Investor
            </div>
            <div style={{ fontSize: '14px', color: CARYA_COLORS.textPrimary, fontWeight: 500 }}>
              {deal.leadInvestor.name}
            </div>
          </div>
        )}

        {/* Deal Date */}
        {deal.dealDate && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: CARYA_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date
            </div>
            <div style={{ fontSize: '13px', color: CARYA_COLORS.textSecondary }}>
              {formatDate(deal.dealDate)}
            </div>
          </div>
        )}

        {/* Verification */}
        {deal.verificationContent && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: CARYA_COLORS.cardBackgroundHover,
            borderRadius: '4px',
            fontSize: '12px',
            color: CARYA_COLORS.textSecondary,
            fontStyle: 'italic',
            border: `1px solid ${CARYA_COLORS.border}`,
          }}>
            "{deal.verificationContent.slice(0, 100)}{deal.verificationContent.length > 100 ? '...' : ''}"
          </div>
        )}
      </CardContent>

          <CardFooter>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!isTracked && onAddToTracker && (
                <Button variant="primary" size="sm" onClick={handleAddToTracker}>
                  Add to Tracker
                </Button>
              )}
              {isTracked && (
                <>
                  <Badge variant="success">Tracked</Badge>
                  {onUntrack && (
                    <Button variant="ghost" size="sm" onClick={handleUntrack}>
                      Untrack
                    </Button>
                  )}
                </>
              )}
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  ↻ Refresh
                </Button>
              )}
            </div>
          </CardFooter>
        </>
      )}

      {/* Collapsed state - just show company name */}
      {isCollapsed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontWeight: 500, color: CARYA_COLORS.textPrimary }}>{deal.companyName}</span>
          <Badge variant={getStageBadgeVariant(deal.roundStage)} style={{ fontSize: '10px' }}>
            {formatCurrency(deal.fundingAmount)}
          </Badge>
        </div>
      )}
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
