/**
 * Deal Lookup Message Handler
 *
 * Handles deal lookup requests from content scripts.
 * Integrates cache layer + API service.
 * In mock mode, returns mock data without calling real API.
 */

import type { DealData } from '@/types/deals';
import type { ExtensionMessage, MessageResponse } from '@/types/messages';
import { apiClient } from '@/services/api/client';
import { searchDeals } from '@/services/api/deals';
import { cache } from '@/services/cache/storage';
import { logger } from '@/utils/logger';

export interface DealLookupPayload {
  companyName?: string;
  founderName?: string;
  query?: string;
}

/**
 * Handle deal lookup message
 *
 * Flow:
 * 1. Check cache for existing deal data
 * 2. If cache miss, call API
 * 3. Store result in cache
 * 4. Return response
 */
export async function handleDealLookup(
  message: ExtensionMessage<DealLookupPayload>
): Promise<MessageResponse<DealData | null>> {
  const payload = message.payload;

  if (!payload) {
    logger.warn('Deal lookup called without payload');
    return {
      success: false,
      error: 'Missing payload',
    };
  }

  const { companyName, founderName, query } = payload;

  // Build search query
  const searchQuery = query || companyName || founderName;

  if (!searchQuery) {
    logger.warn('Deal lookup called without query', { payload });
    return {
      success: false,
      error: 'Missing search query (companyName, founderName, or query required)',
    };
  }

  logger.info('Deal lookup requested', { searchQuery });

  // Load current settings to check environment
  const settings = await apiClient.loadSettings();
  const isMockMode = settings.environment === 'mock';

  logger.info('Deal lookup environment', { environment: settings.environment, isMockMode });

  // MOCK DATA - returned in mock mode or as fallback
  const MOCK_DEALS: Record<string, DealData> = {
    'anthropic': {
      id: 'mock-anthropic-1',
      companyName: 'Anthropic',
      fundingAmount: 450000000,
      currency: 'USD',
      roundStage: 'Series B',
      dealDate: '2023-05-23',
      leadInvestor: { name: 'Google', type: 'Corporate' },
      investors: [
        { name: 'Google', type: 'Corporate' },
        { name: 'Spark Capital', type: 'VC' },
        { name: 'Sound Ventures', type: 'VC' },
      ],
      verificationContent: 'Anthropic raised $450M in Series B funding led by Google.',
      source: 'mock-data',
      confidence: 100,
    },
    'openai': {
      id: 'mock-openai-1',
      companyName: 'OpenAI',
      fundingAmount: 10000000000,
      currency: 'USD',
      roundStage: 'Growth',
      dealDate: '2023-01-23',
      leadInvestor: { name: 'Microsoft', type: 'Corporate' },
      investors: [
        { name: 'Microsoft', type: 'Corporate' },
        { name: 'Khosla Ventures', type: 'VC' },
        { name: 'Thrive Capital', type: 'VC' },
      ],
      verificationContent: 'OpenAI raised $10B from Microsoft in multi-year investment.',
      source: 'mock-data',
      confidence: 100,
    },
    'stripe': {
      id: 'mock-stripe-1',
      companyName: 'Stripe',
      fundingAmount: 600000000,
      currency: 'USD',
      roundStage: 'Series D+',
      dealDate: '2023-03-15',
      leadInvestor: { name: 'Thrive Capital', type: 'VC' },
      investors: [
        { name: 'Thrive Capital', type: 'VC' },
        { name: 'Andreessen Horowitz', type: 'VC' },
        { name: 'Goldman Sachs', type: 'Other' },
      ],
      verificationContent: 'Stripe raised $600M at $50B valuation.',
      source: 'mock-data',
      confidence: 95,
    },
  };

  const mockKey = searchQuery.toLowerCase();

  // In mock mode, only return mock data - don't call real API
  if (isMockMode) {
    if (MOCK_DEALS[mockKey]) {
      logger.info('Mock mode: Returning mock deal data', { searchQuery, mockKey });
      return { success: true, data: MOCK_DEALS[mockKey], cached: false };
    } else {
      logger.info('Mock mode: No mock data for query', { searchQuery, mockKey, availableMockKeys: Object.keys(MOCK_DEALS) });
      return { success: true, data: null, cached: false };
    }
  }

  // Non-mock mode: Check cache first
  const cacheKey = `deal:${searchQuery.toLowerCase()}`;
  const cached = await cache.get<DealData>(cacheKey);

  if (cached) {
    logger.info('Deal found in cache', { searchQuery });
    return {
      success: true,
      data: cached,
      cached: true,
    };
  }

  // Cache miss - call real API
  logger.debug('Cache miss, calling API', { searchQuery, environment: settings.environment });

  try {
    const result = await searchDeals({ query: searchQuery, limit: 1 });

    if (result.success && result.data && result.data.deals.length > 0) {
      const deal = result.data.deals[0];

      // Store in cache
      await cache.set(cacheKey, deal);

      logger.info('Deal found via API', {
        companyName: deal.companyName,
        fundingAmount: deal.fundingAmount,
      });

      return {
        success: true,
        data: deal,
        cached: false,
      };
    } else if (result.success) {
      // No deal found via API
      logger.info('No deal found via API', { searchQuery });
      return {
        success: true,
        data: null,
        cached: false,
      };
    } else {
      // API call failed - return error with type
      logger.warn('Deal lookup failed', { error: result.error, errorType: result.errorType });
      return {
        success: false,
        error: result.error || 'Failed to fetch deal data',
        errorType: result.errorType,
      };
    }
  } catch (error) {
    logger.error('Deal lookup API exception', {
      searchQuery,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deal data',
      errorType: 'NETWORK_ERROR',
    };
  }
}
