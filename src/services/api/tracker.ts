// Tracker API endpoints
// NOTE: The backend may not have a /tracker endpoint
// If API call fails, we return success: false but the content script
// already saves to chrome.storage.local as a fallback

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

/**
 * Add company to tracker
 * Logs full request/response for debugging
 */
export async function addToTracker(
  payload: AddToTrackerPayload
): Promise<APIResponse<TrackerItem>> {
  const endpoint = TRACKER_ENDPOINTS.ADD;

  logger.info('Add to tracker - starting', {
    endpoint,
    payload,
  });

  try {
    logger.info('Add to tracker - calling API', {
      endpoint,
      method: 'POST',
      payload: JSON.stringify(payload),
    });

    const response = await apiClient.post<TrackerItem>(endpoint, payload);

    logger.info('Add to tracker - API response', {
      endpoint,
      success: response.success,
      error: response.error,
      data: response.data,
      fullResponse: JSON.stringify(response),
    });

    return response;
  } catch (error) {
    logger.error('Add to tracker - exception', {
      endpoint,
      payload,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
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
    logger.error('Move tracker status error', { payload, error });
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
    logger.error('Check tracker status error', { companyName, error });
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
    logger.error('Get tracker item error', { id, error });
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
    logger.error('Delete tracker item error', { id, error });
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
    logger.error('List tracker items error', { error });
    return {
      success: false,
      error: 'Failed to list tracker items',
    };
  }
}
