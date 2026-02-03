// Feedback API endpoints

import type { FlagIssuePayload } from '../../types/messages';
import type { APIResponse } from '../../types/api';
import { apiClient } from './client';
import { FEEDBACK_ENDPOINTS } from '../../constants/endpoints';
import { logger } from '../../utils/logger';

interface FeedbackResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

interface SuggestionPayload {
  companyName: string;
  linkedInUrl: string;
  reason?: string;
}

/**
 * Submit suggestion for missing company
 */
export async function submitSuggestion(
  payload: SuggestionPayload
): Promise<APIResponse<FeedbackResponse>> {
  try {
    const response = await apiClient.post<FeedbackResponse>(
      FEEDBACK_ENDPOINTS.SUGGESTION,
      payload
    );

    logger.info('Submit suggestion', {
      companyName: payload.companyName,
      success: response.success,
    });

    return response;
  } catch (error) {
    logger.error('Submit suggestion error', { payload, error });
    return {
      success: false,
      error: 'Failed to submit suggestion',
    };
  }
}

/**
 * Flag data quality issue
 */
export async function flagIssue(
  payload: FlagIssuePayload
): Promise<APIResponse<FeedbackResponse>> {
  try {
    const response = await apiClient.post<FeedbackResponse>(
      FEEDBACK_ENDPOINTS.ISSUE,
      payload
    );

    logger.info('Flag issue', {
      companyName: payload.companyName,
      issueType: payload.issueType,
      success: response.success,
    });

    return response;
  } catch (error) {
    logger.error('Flag issue error', { payload, error });
    return {
      success: false,
      error: 'Failed to flag issue',
    };
  }
}

/**
 * Report bug
 */
export async function reportBug(
  description: string,
  context?: Record<string, unknown>
): Promise<APIResponse<FeedbackResponse>> {
  try {
    const response = await apiClient.post<FeedbackResponse>(FEEDBACK_ENDPOINTS.BUG_REPORT, {
      description,
      context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    logger.info('Report bug', { success: response.success });

    return response;
  } catch (error) {
    logger.error('Report bug error', { description, error });
    return {
      success: false,
      error: 'Failed to report bug',
    };
  }
}
