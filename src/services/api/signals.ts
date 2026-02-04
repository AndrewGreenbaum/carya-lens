// Stealth Signals API endpoints

import type { StealthSignalData } from '../../types/signals';
import type { APIResponse } from '../../types/api';
import { apiClient } from './client';
import { SIGNALS_ENDPOINTS } from '../../constants/endpoints';
import { logger } from '../../utils/logger';

/**
 * Get stealth signals for a company
 */
export async function getStealthSignals(
  companyName: string
): Promise<APIResponse<StealthSignalData>> {
  try {
    const endpoint = SIGNALS_ENDPOINTS.GET_BY_COMPANY(companyName);
    const response = await apiClient.get<StealthSignalData>(endpoint);

    logger.info('Get stealth signals', {
      companyName,
      score: response.data?.score,
      success: response.success,
    });

    return response;
  } catch (error) {
    logger.error('Get stealth signals error', {
      companyName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to get stealth signals',
    };
  }
}
