// Tracker API endpoints
// Backend endpoints:
// - POST /tracker/from-deal - Add existing deal to tracker (requires deal_id)
// - POST /tracker - Create manual tracker item (requires company_name)
// Both require X-API-Key header

import type {
  TrackerItem,
  AddToTrackerPayload,
  MoveStatusPayload,
} from '../../types/tracker';
import type { TrackerStatusResponse } from '../../types/messages';
import type { APIResponse } from '../../types/api';
import { apiClient } from './client';
import { TRACKER_ENDPOINTS } from '../../constants/endpoints';
import { logger } from '../../utils/logger';

// API request types for tracker
interface AddFromDealRequest {
  deal_id: number;
  status?: string;
}

interface CreateTrackerItemRequest {
  company_name: string;
  round_type?: string;
  amount?: string;
  lead_investor?: string;
  website?: string;
  notes?: string;
  status?: string;
}

// API response type from tracker
interface TrackerItemResponse {
  id: number;
  company_name: string;
  round_type: string | null;
  amount: string | null;
  lead_investor: string | null;
  website: string | null;
  status: string;
  deal_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Add deal to tracker using deal_id (preferred method)
 * Uses POST /tracker/from-deal
 */
export async function addDealToTracker(
  dealId: string | number,
  status: string = 'watching'
): Promise<APIResponse<TrackerItemResponse>> {
  const endpoint = TRACKER_ENDPOINTS.ADD_FROM_DEAL;
  const payload: AddFromDealRequest = {
    deal_id: typeof dealId === 'string' ? parseInt(dealId, 10) : dealId,
    status,
  };

  logger.info('Add deal to tracker - starting', {
    endpoint,
    dealId,
    status,
    payload: JSON.stringify(payload),
  });

  try {
    const response = await apiClient.post<TrackerItemResponse>(endpoint, payload);

    logger.info('Add deal to tracker - API response', {
      endpoint,
      success: response.success,
      error: response.error,
      data: response.data ? JSON.stringify(response.data) : null,
    });

    return response;
  } catch (error) {
    logger.error('Add deal to tracker - exception', {
      endpoint,
      dealId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add deal to tracker',
    };
  }
}

/**
 * Add company to tracker (manual entry)
 * Uses POST /tracker
 * Logs full request/response for debugging
 */
export async function addToTracker(
  payload: AddToTrackerPayload
): Promise<APIResponse<TrackerItemResponse>> {
  const endpoint = TRACKER_ENDPOINTS.ADD;

  // Map our payload to API format
  const apiPayload: CreateTrackerItemRequest = {
    company_name: payload.companyName,
    website: payload.website,
    notes: payload.notes,
    status: 'watching',
  };

  logger.info('Add to tracker - starting', {
    endpoint,
    payload: JSON.stringify(apiPayload),
  });

  try {
    const response = await apiClient.post<TrackerItemResponse>(endpoint, apiPayload);

    logger.info('Add to tracker - API response', {
      endpoint,
      success: response.success,
      error: response.error,
      data: response.data ? JSON.stringify(response.data) : null,
    });

    return response;
  } catch (error) {
    logger.error('Add to tracker - exception', {
      endpoint,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to tracker',
    };
  }
}

/**
 * Move tracker item to new status
 */
export async function moveTrackerStatus(
  payload: MoveStatusPayload
): Promise<APIResponse<TrackerItem>> {
  try {
    const endpoint = TRACKER_ENDPOINTS.MOVE(payload.itemId);
    const response = await apiClient.post<TrackerItem>(endpoint, {
      status: payload.newStatus,
      notes: payload.notes,
    });

    logger.info('Move tracker status', {
      itemId: payload.itemId,
      newStatus: payload.newStatus,
      success: response.success,
    });

    return response;
  } catch (error) {
    logger.error('Move tracker status error', {
      payload,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to update status',
    };
  }
}

/**
 * Check if company is tracked
 */
export async function checkTrackerStatus(
  companyName: string
): Promise<APIResponse<TrackerStatusResponse>> {
  try {
    const searchParams = new URLSearchParams({ company_name: companyName });
    const endpoint = `${TRACKER_ENDPOINTS.CHECK_STATUS}?${searchParams.toString()}`;
    const response = await apiClient.get<TrackerStatusResponse>(endpoint);

    logger.info('Check tracker status', {
      companyName,
      isTracked: response.data?.isTracked ?? false,
    });

    return response;
  } catch (error) {
    logger.error('Check tracker status error', {
      companyName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to check tracker status',
    };
  }
}

/**
 * Get tracker item by ID
 */
export async function getTrackerItem(id: string): Promise<APIResponse<TrackerItem>> {
  try {
    const endpoint = TRACKER_ENDPOINTS.GET(id);
    const response = await apiClient.get<TrackerItem>(endpoint);

    logger.info('Get tracker item', { id, found: response.success });

    return response;
  } catch (error) {
    logger.error('Get tracker item error', {
      id,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to get tracker item',
    };
  }
}

/**
 * Delete tracker item
 */
export async function deleteTrackerItem(id: string): Promise<APIResponse<void>> {
  try {
    const endpoint = TRACKER_ENDPOINTS.DELETE(id);
    const response = await apiClient.delete<void>(endpoint);

    logger.info('Delete tracker item', { id, success: response.success });

    return response;
  } catch (error) {
    logger.error('Delete tracker item error', {
      id,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to delete tracker item',
    };
  }
}

/**
 * List all tracker items
 */
export async function listTrackerItems(): Promise<APIResponse<TrackerItem[]>> {
  try {
    const response = await apiClient.get<TrackerItem[]>(TRACKER_ENDPOINTS.LIST);

    logger.info('List tracker items', { count: response.data?.length ?? 0 });

    return response;
  } catch (error) {
    logger.error('List tracker items error', {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to list tracker items',
    };
  }
}
