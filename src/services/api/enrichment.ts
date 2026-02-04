// Enrichment API endpoints

import type { ScrapedProfileData, ScrapedCompanyData } from '../../types/linkedin';
import type { APIResponse } from '../../types/api';
import { apiClient } from './client';
import { ENRICHMENT_ENDPOINTS } from '../../constants/endpoints';
import { logger } from '../../utils/logger';

interface EnrichmentPayload {
  linkedInUrl: string;
  data: ScrapedProfileData | ScrapedCompanyData;
}

interface EnrichmentResponse {
  success: boolean;
  message: string;
  enrichmentId?: string;
}

/**
 * Submit LinkedIn data for enrichment
 */
export async function enrichFromLinkedIn(
  payload: EnrichmentPayload
): Promise<APIResponse<EnrichmentResponse>> {
  try {
    const response = await apiClient.post<EnrichmentResponse>(
      ENRICHMENT_ENDPOINTS.LINKEDIN,
      payload
    );

    logger.info('Enrich from LinkedIn', {
      url: payload.linkedInUrl,
      success: response.success,
    });

    return response;
  } catch (error) {
    logger.error('Enrich from LinkedIn error', {
      payload,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to submit enrichment',
    };
  }
}

/**
 * Enrich company data
 */
export async function enrichCompany(
  companyName: string,
  website?: string
): Promise<APIResponse<EnrichmentResponse>> {
  try {
    const response = await apiClient.post<EnrichmentResponse>(
      ENRICHMENT_ENDPOINTS.COMPANY,
      { companyName, website }
    );

    logger.info('Enrich company', { companyName, success: response.success });

    return response;
  } catch (error) {
    logger.error('Enrich company error', {
      companyName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to enrich company',
    };
  }
}

/**
 * Enrich founder data
 */
export async function enrichFounder(
  founderName: string,
  linkedInUrl?: string
): Promise<APIResponse<EnrichmentResponse>> {
  try {
    const response = await apiClient.post<EnrichmentResponse>(
      ENRICHMENT_ENDPOINTS.FOUNDER,
      { founderName, linkedInUrl }
    );

    logger.info('Enrich founder', { founderName, success: response.success });

    return response;
  } catch (error) {
    logger.error('Enrich founder error', {
      founderName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to enrich founder',
    };
  }
}
