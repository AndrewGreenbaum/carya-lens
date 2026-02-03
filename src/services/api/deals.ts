// Deal API endpoints
// Maps real API response to internal DealData format

import type { DealData, DealSearchParams, DealSearchResult, RoundStage } from '../../types/deals';
import type { APIResponse } from '../../types/api';
import { apiClient, type APIErrorType } from './client';
import { DEALS_ENDPOINTS } from '../../constants/endpoints';
import { logger } from '../../utils/logger';

// Raw API response types (what the server actually returns)
interface RawDeal {
  id: string;
  startup_name: string;
  investment_stage: string;
  amount_invested: string;
  date: string;
  lead_investor: string | null;
  lead_partner: string | null;
  verification_snippet: string | null;
  company_website: string | null;
  company_linkedin: string | null;
  source_url: string | null;
  source_name: string | null;
  founders: string | null;
  investor_roles: string[];
  enterprise_category: string;
  is_enterprise_ai: boolean;
  is_ai_deal: boolean;
  lead_evidence_weak: boolean;
  amount_needs_review: boolean;
  amount_review_reason: string | null;
  next_steps: string | null;
}

interface RawAPIResponse {
  deals: RawDeal[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Extended response type that includes errorType
export type DealSearchResponse = APIResponse<DealSearchResult> & { errorType?: APIErrorType };

/**
 * Parse amount string like "$8M" or "$450M" to number
 */
function parseAmount(amountStr: string | null): number {
  if (!amountStr) return 0;

  // Remove $ and spaces
  const cleaned = amountStr.replace(/[$,\s]/g, '').toUpperCase();

  // Extract number and multiplier
  const match = cleaned.match(/^([\d.]+)([KMB])?$/);
  if (!match) {
    logger.warn('Could not parse amount', { amountStr });
    return 0;
  }

  const num = parseFloat(match[1]);
  const multiplier = match[2];

  switch (multiplier) {
    case 'K': return num * 1000;
    case 'M': return num * 1000000;
    case 'B': return num * 1000000000;
    default: return num;
  }
}

/**
 * Map investment_stage to our RoundStage type
 */
function mapRoundStage(stage: string): RoundStage {
  const stageMap: Record<string, RoundStage> = {
    'pre_seed': 'Pre-Seed',
    'preseed': 'Pre-Seed',
    'seed': 'Seed',
    'series_a': 'Series A',
    'series_b': 'Series B',
    'series_c': 'Series C',
    'series_d': 'Series D+',
    'series_e': 'Series D+',
    'series_f': 'Series D+',
    'growth': 'Growth',
    'bridge': 'Bridge',
    'acquisition': 'Acquisition',
    'ipo': 'IPO',
  };

  const normalized = stage.toLowerCase().replace(/[^a-z_]/g, '');
  return stageMap[normalized] || 'Unknown';
}

/**
 * Map raw API deal to internal DealData format
 */
function mapDealData(raw: RawDeal): DealData {
  return {
    id: raw.id,
    companyName: raw.startup_name,
    fundingAmount: parseAmount(raw.amount_invested),
    currency: 'USD',
    roundStage: mapRoundStage(raw.investment_stage),
    dealDate: raw.date,
    leadInvestor: raw.lead_investor ? {
      name: raw.lead_investor,
      type: 'VC',
    } : undefined,
    verificationContent: raw.verification_snippet || undefined,
    source: raw.source_name || undefined,
    confidence: raw.lead_evidence_weak ? 70 : 95,
  };
}

/**
 * Search for deals by company or founder name
 */
export async function searchDeals(
  params: DealSearchParams
): Promise<DealSearchResponse> {
  logger.info('searchDeals called', { params });

  try {
    const searchParams = new URLSearchParams();

    if (params.query) {
      searchParams.set('search', params.query);
    }
    if (params.limit) {
      searchParams.set('limit', params.limit.toString());
    }

    const endpoint = `${DEALS_ENDPOINTS.SEARCH}?${searchParams.toString()}`;
    logger.info('Calling API endpoint', { endpoint });

    const response = await apiClient.get<RawAPIResponse>(endpoint);

    logger.info('API response received', {
      success: response.success,
      error: response.error,
      hasData: !!response.data,
      dealCount: response.data?.deals?.length ?? 0,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
        errorType: response.errorType,
      };
    }

    if (!response.data) {
      return {
        success: true,
        data: { deals: [], totalResults: 0 },
      };
    }

    // Map raw deals to internal format
    const mappedDeals = response.data.deals.map(mapDealData);

    logger.info('Deal search complete', {
      params,
      found: mappedDeals.length,
      firstDeal: mappedDeals[0]?.companyName,
    });

    return {
      success: true,
      data: {
        deals: mappedDeals,
        totalResults: response.data.total,
      },
    };
  } catch (error) {
    logger.error('Deal search error', {
      params,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search deals',
      errorType: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get deal by ID
 */
export async function getDealById(id: string): Promise<APIResponse<DealData>> {
  try {
    const endpoint = DEALS_ENDPOINTS.GET_BY_ID(id);
    const response = await apiClient.get<RawDeal>(endpoint);

    logger.info('Deal get by ID', { id, found: response.success });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Deal not found',
      };
    }

    return {
      success: true,
      data: mapDealData(response.data),
    };
  } catch (error) {
    logger.error('Deal get error', {
      id,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to get deal',
    };
  }
}

/**
 * Lookup deal by company or founder (convenience function)
 */
export async function lookupDeal(
  companyName?: string,
  founderName?: string
): Promise<APIResponse<DealData | null>> {
  try {
    const query = companyName || founderName || '';
    const response = await searchDeals({ query, companyName, founderName, limit: 1 });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    if (!response.data || response.data.deals.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: response.data.deals[0],
    };
  } catch (error) {
    logger.error('Deal lookup error', {
      companyName,
      founderName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to lookup deal',
    };
  }
}
