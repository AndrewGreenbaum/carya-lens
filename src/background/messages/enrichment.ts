/**
 * Enrichment Message Handler
 *
 * Handles LinkedIn data enrichment requests.
 */

import type { ExtensionMessage, MessageResponse } from '@/types/messages';
import type { ScrapedProfileData, ScrapedCompanyData } from '@/types/linkedin';
import { enrichFromLinkedIn } from '@/services/api/enrichment';
import { logger } from '@/utils/logger';

export interface EnrichmentMessagePayload {
  linkedInUrl: string;
  scrapedData: ScrapedProfileData | ScrapedCompanyData;
}

/**
 * Handle enrichment request
 *
 * Submits LinkedIn-scraped data to backend for enrichment.
 * No caching (this is an explicit action).
 */
export async function handleEnrichment(
  message: ExtensionMessage<EnrichmentMessagePayload>
): Promise<MessageResponse<void>> {
  const payload = message.payload;

  if (!payload || !payload.linkedInUrl || !payload.scrapedData) {
    logger.warn('Enrichment called without required data');
    return {
      success: false,
      error: 'Missing LinkedIn URL or scraped data',
    };
  }

  logger.info('Enrichment requested', {
    linkedInUrl: payload.linkedInUrl,
  });

  try {
    // Transform to API payload format
    const result = await enrichFromLinkedIn({
      linkedInUrl: payload.linkedInUrl,
      data: payload.scrapedData,
    });

    if (result.success) {
      logger.info('Enrichment submitted successfully', {
        linkedInUrl: payload.linkedInUrl,
      });

      return {
        success: true,
        data: undefined,
      };
    } else {
      logger.warn('Enrichment failed', {
        linkedInUrl: payload.linkedInUrl,
        error: result.error,
      });

      return {
        success: false,
        error: result.error || 'Failed to submit enrichment',
      };
    }
  } catch (error) {
    logger.error('Enrichment error', {
      linkedInUrl: payload.linkedInUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit enrichment',
    };
  }
}
