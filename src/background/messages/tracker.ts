/**
 * Tracker Message Handler
 *
 * Handles tracker operations (add, check status, move).
 */

import type { TrackerItem, TrackerStatus } from '@/types/tracker';
import type { ExtensionMessage, MessageResponse, TrackerStatusResponse } from '@/types/messages';
import { addToTracker, checkTrackerStatus, moveTrackerStatus } from '@/services/api/tracker';
import { cache } from '@/services/cache/storage';
import { logger } from '@/utils/logger';

export interface AddToTrackerPayload {
  companyName: string;
  website?: string;
  founderLinkedIn?: string;
  notes?: string;
}

export interface CheckTrackerPayload {
  companyName: string;
}

export interface MoveTrackerPayload {
  itemId: string;
  newStatus: TrackerStatus;
}

/**
 * Handle add to tracker request
 */
export async function handleAddToTracker(
  message: ExtensionMessage<AddToTrackerPayload>
): Promise<MessageResponse<TrackerItem>> {
  const payload = message.payload;

  if (!payload || !payload.companyName) {
    logger.warn('Add to tracker called without company name');
    return {
      success: false,
      error: 'Missing company name',
    };
  }

  logger.info('Adding to tracker', { companyName: payload.companyName });

  try {
    const result = await addToTracker(payload);

    if (result.success && result.data) {
      // Invalidate tracker status cache
      const cacheKey = `tracker:${payload.companyName.toLowerCase()}`;
      await cache.remove(cacheKey);

      logger.info('Added to tracker', { companyName: payload.companyName });

      return {
        success: true,
        data: result.data,
      };
    } else {
      logger.warn('Failed to add to tracker', { companyName: payload.companyName });
      return {
        success: false,
        error: result.error || 'Failed to add to tracker',
      };
    }
  } catch (error) {
    logger.error('Add to tracker error', {
      companyName: payload.companyName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to tracker',
    };
  }
}

/**
 * Handle check tracker status request
 */
export async function handleCheckTrackerStatus(
  message: ExtensionMessage<CheckTrackerPayload>
): Promise<MessageResponse<TrackerStatusResponse>> {
  const payload = message.payload;

  if (!payload || !payload.companyName) {
    logger.warn('Check tracker called without company name');
    return {
      success: false,
      error: 'Missing company name',
    };
  }

  const { companyName } = payload;

  logger.debug('Checking tracker status', { companyName });

  // Check cache first
  const cacheKey = `tracker:${companyName.toLowerCase()}`;
  const cached = await cache.get<TrackerStatusResponse>(cacheKey);

  if (cached) {
    logger.debug('Tracker status from cache', { companyName });
    return {
      success: true,
      data: cached,
      cached: true,
    };
  }

  // Cache miss - call API
  try {
    const result = await checkTrackerStatus(companyName);

    if (result.success && result.data) {
      // Store in cache
      await cache.set(cacheKey, result.data);

      logger.debug('Tracker status from API', { companyName, isTracked: result.data.isTracked });

      return {
        success: true,
        data: result.data,
        cached: false,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to check tracker status',
      };
    }
  } catch (error) {
    logger.error('Check tracker status error', {
      companyName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check tracker status',
    };
  }
}

/**
 * Handle move tracker item request
 */
export async function handleMoveTracker(
  message: ExtensionMessage<MoveTrackerPayload>
): Promise<MessageResponse<void>> {
  const payload = message.payload;

  if (!payload || !payload.itemId || !payload.newStatus) {
    logger.warn('Move tracker called without required fields');
    return {
      success: false,
      error: 'Missing itemId or newStatus',
    };
  }

  logger.info('Moving tracker item', { itemId: payload.itemId, newStatus: payload.newStatus });

  try {
    const result = await moveTrackerStatus({
      itemId: payload.itemId,
      newStatus: payload.newStatus,
    });

    if (result.success) {
      logger.info('Tracker item moved', { itemId: payload.itemId, newStatus: payload.newStatus });

      return {
        success: true,
        data: undefined,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to move tracker item',
      };
    }
  } catch (error) {
    logger.error('Move tracker error', {
      itemId: payload.itemId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move tracker item',
    };
  }
}
